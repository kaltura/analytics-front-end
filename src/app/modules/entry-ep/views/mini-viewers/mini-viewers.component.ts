import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Tab} from 'shared/components/report-tabs/report-tabs.component';
import {KalturaClient, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportExportItem, KalturaReportExportParams, KalturaReportInterval,
  KalturaReportResponseOptions, KalturaReportTotal, KalturaReportType, KalturaReportExportItemType, ReportExportToCsvAction} from 'kaltura-ngx-client';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {AppAnalytics, AuthService, BrowserService, ErrorsManagerService, ReportConfig, ReportService} from 'shared/services';
import {finalize, switchMap} from 'rxjs/operators';
import {of as ObservableOf} from 'rxjs';
import {ReportDataConfig} from 'shared/services/storage-data-base.config';
import {TranslateService} from '@ngx-translate/core';
import {MiniViewersConfig} from './mini-viewers.config';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {analyticsConfig} from "configuration/analytics-config";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";

@Component({
  selector: 'app-ep-mini-viewers',
  templateUrl: './mini-viewers.component.html',
  styleUrls: ['./mini-viewers.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpMiniViewersComponent'),
    MiniViewersConfig,
    ReportService,
  ]
})
export class EpMiniViewersComponent implements OnInit, OnDestroy {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'ep-mini-viewers';

  @Input() entryIdIn = '';
  @Input() exporting = false;
  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() isVirtualClassroom: boolean;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastUniqueUsers;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public _livePercent = 0;
  public _recordingPercent = 0;
  public _liveAndRecordingPercent = 0;

  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _browserService: BrowserService,
              private _analytics: AppAnalytics,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: MiniViewersConfig,
              private _kalturaClient: KalturaClient,
              private _logger: KalturaLogger) {

    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
    this._loadReport();
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadReport();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    const allViewers = this._tabsData.length > 2 ? Number(this._tabsData[1].rawValue) + Number(this._tabsData[2].rawValue) : this._tabsData.length > 1 ?Number(this._tabsData[1].rawValue) : 0;
    const liveAndRecordingViewers = allViewers * 2 - Number(this._tabsData[0].rawValue);
    this._livePercent = this._tabsData.length > 1 ? Number(this._tabsData[1].rawValue) / liveAndRecordingViewers * 100 : 0;
    this._recordingPercent = this._tabsData.length > 2 ? Number(this._tabsData[2].rawValue) / liveAndRecordingViewers * 100 : 0;
    this._liveAndRecordingPercent = allViewers > Number(this._tabsData[0].rawValue) ? (allViewers - Number(this._tabsData[0].rawValue)) / liveAndRecordingViewers * 100 : 0;
  }

  public exportUsers(): void {
    this._isBusy = true;
    this._blockerMessage = null;

    const responseOptions = new KalturaReportResponseOptions({
      delimiter: analyticsConfig.valueSeparator,
      skipEmptyDates: analyticsConfig.skipEmptyBuckets
    });

    const reportsItemsGroup = 'Unique viewers';
    const reportItems = [new KalturaReportExportItem({
      action: KalturaReportExportItemType.table,
      order: '-name',
      reportTitle: 'Unique viewers',
      reportType: KalturaReportType.epWebcastVodLiveUsersEngagement,
      responseOptions,
      filter: this._filter
    })];

    let baseUrl = '';
    try {
      const origin = window.parent && window.parent.location && window.parent.location.origin ? window.parent.location.origin : window.location.origin;
      const isKMC = window.parent && typeof window.parent['kmcng'] === 'object';
      const exportRoute = analyticsConfig.kalturaServer.exportRoute ? analyticsConfig.kalturaServer.exportRoute : isKMC ? '/index.php/kmcng/analytics/export?id=' : '/userreports/downloadreport?report_id=';
      baseUrl = encodeURIComponent(`${origin}${exportRoute}`);
    } catch (e) {
      this._logger.error('Error accessing parent window location', e);
    }

    const exportAction = new ReportExportToCsvAction({ params: new KalturaReportExportParams(
      { timeZoneOffset: this._filter.timeZoneOffset,
        reportsItemsGroup,
        reportItems,
        baseUrl })
    });

    this._analytics.trackClickEvent('Export');

    this._kalturaClient.request(exportAction)
      .pipe(
        cancelOnDestroy(this),
        finalize(() => {
          this._isBusy = false;
        })
      )
      .subscribe(
        () => {
          this._browserService.alert({
            header: this._translate.instant('app.exportReports.exportReports'),
            message: this._translate.instant('app.exportReports.successMessage'),
          });
        },
        () => {
          this._browserService.alert({
            header: this._translate.instant('app.exportReports.exportReports'),
            message: this._translate.instant('app.exportReports.errorMessage'),
          });
        });
  }

  ngOnDestroy(): void {
  }

}
