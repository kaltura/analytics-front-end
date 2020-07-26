import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { WebcastBaseReportComponent } from '../webcast-base-report/webcast-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import {
  CuePointListAction, KalturaAnnotationFilter, KalturaCategory, KalturaClient, KalturaCuePointType, KalturaCuePoint,
  KalturaCuePointListResponse,
  KalturaEndUserReportInputFilter,
  KalturaFilterPager, KalturaNullableBoolean, KalturaObjectBase,
  KalturaObjectBaseFactory,
  KalturaReportInterval,
  KalturaReportTotal,
  KalturaReportType, KalturaRequestOptions, KalturaResponseProfileHolder, KalturaResponseProfileType,
} from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniEngagementConfig } from './mini-engagement.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { reportTypeMap } from "shared/utils/report-type-map";
import { analyticsConfig } from "configuration/analytics-config";
import * as moment from "moment";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";


@Component({
  selector: 'app-webcast-mini-engagement',
  templateUrl: './mini-engagement.component.html',
  styleUrls: ['./mini-engagement.component.scss'],
  providers: [
    KalturaLogger.createLogger('WebcastMiniEngagementComponent'),
    MiniEngagementConfig,
    ReportService,
  ]
})

export class WebcastMiniEngagementComponent extends WebcastBaseReportComponent implements OnDestroy, OnInit {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'webcast-mini-engagement';

  @Input() entryIdIn = '';
  @Input() entryId = '';
  @Input() showDownload = false;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  private _order = '-date_id';
  private _reportType = reportTypeMap(KalturaReportType.engagementWebcast);
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _kalturaClient: KalturaClient,
              private _browserService: BrowserService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: MiniEngagementConfig,
              private _logger: KalturaLogger) {
    super();

    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
    // const xml = '<metadata><State>Pending</State><ThreadId>1_khzqkybn</ThreadId><Type>Question</Type><ThreadCreatorId>ilanit.schreiber</ThreadCreatorId></metadata>';
    // const parser = new DOMParser();
    // const xmlDoc = parser.parseFromString(xml,"text/xml");
    // const type = xmlDoc.getElementsByTagName("Type")[0].childNodes[0].nodeValue;

    this._kalturaClient
      .request(this.getEntryCuePoints())
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (data: KalturaCuePointListResponse) => {
          debugger;
        },
        error => {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  ngOnDestroy(): void {
  }

  private getEntryCuePoints(): CuePointListAction {

    const filter: KalturaAnnotationFilter = new KalturaAnnotationFilter({
      cuePointTypeEqual: KalturaCuePointType.annotation,
      tagsLike: 'qna',
      entryIdEqual: this.entryId,
      orderBy: '+updatedAt',
      isPublicEqual: KalturaNullableBoolean.trueValue
    });

    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});

    return new CuePointListAction({ filter, pager })
      .setRequestOptions(
        new KalturaRequestOptions({
          responseProfile: new KalturaResponseProfileHolder({
            systemName: 'QandA'
          })
        })
      );
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };

        return this._reportService.getReport(compareReportConfig, sections, false)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {

          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }

          if (compare) {
            this._handleCompare(report, compare);
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

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }

  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };

    if (current.totals && compare.totals) {
      this._tabsData = this._compareService.compareTotalsData(
        currentPeriod,
        comparePeriod,
        current.totals,
        compare.totals,
        this._dataConfig.totals
      );
    }
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
  }

  public export(): void {
    this._browserService.exportToCsv(`${this._authService.pid}-Report_export-${this.entryIdIn.split(analyticsConfig.valueSeparator)[0]}.csv`,[
      ["# ------------------------------------"],
      ["Report: Quality"],
      ["Please note that the data below is filtered based on the filter applied in the report"],
      ["Filtered dates: " + moment.unix(this._filter.fromDate).toDate() + " - " + moment.unix(this._filter.toDate).toDate()],
      ["Avg. buffering rate (%)", "Avg. Bitrate (Kbps)", "Minutes broadcasted"],
      // [(parseFloat(this._tabsData[0].rawValue.toString()) * 100).toFixed(2), (parseFloat(this._tabsData[1].rawValue.toString())).toFixed(2), this.lastBroadcastDuration.length ? parseFloat(this.lastBroadcastDuration.replace(/,/g, '')).toFixed(2) : this._translate.instant('app.common.na') ],
      ["# ------------------------------------"],
    ]);
  }

  public download(): void {
    alert("Download!")
  }
}
