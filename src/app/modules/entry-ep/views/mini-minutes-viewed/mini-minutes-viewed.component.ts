import { Component, Input, OnInit } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {
  AuthService,
  BrowserService,
  ErrorsManagerService,
  ReportConfig,
  ReportHelper,
  ReportService
} from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniMinutesViewedConfig } from './mini-minutes-viewed.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-ep-mini-minutes-viewed',
  templateUrl: './mini-minutes-viewed.component.html',
  styleUrls: ['./mini-minutes-viewed.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpMiniMinutesViewedComponent'),
    MiniMinutesViewedConfig,
    ReportService,
  ]
})
export class EpMiniMinutesViewedComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'ep-mini-minutes-viewed';

  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() endDate: Date;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastHighlights;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public _livePercent = 0;
  public _recordingPercent = 0;

  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _browserService: BrowserService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: MiniMinutesViewedConfig,
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
    if (this._tabsData.length > 1) {
      this._livePercent = parseFloat(this._tabsData[0].value) > parseFloat(this._tabsData[1].value) ? 100 : parseFloat(this._tabsData[0].value) / parseFloat(this._tabsData[1].value) * 100;
      this._recordingPercent = parseFloat(this._tabsData[0].value) < parseFloat(this._tabsData[1].value) ? 100 : parseFloat(this._tabsData[1].value) / parseFloat(this._tabsData[0].value) * 100;
    }
  }

}
