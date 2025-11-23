import { Component, Input, OnInit } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { forkJoin, of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { MiniEngagementConfig } from './mini-engagement.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-ep-mini-engagement',
  templateUrl: './mini-engagement.component.html',
  styleUrls: ['./mini-engagement.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpMiniEngagementComponent'),
    MiniEngagementConfig,
    ReportService,
  ]
})
export class EpMiniEngagementComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  private _cncDataConfig: ReportDataConfig;
  protected _componentId = 'ep-mini-minutes-viewed';

  @Input() entryIdIn = '';
  @Input() exporting = false;
  @Input() set startDate(value: Date) {
    this._startDate = value;
    setTimeout(() => this._loadReport(), 0);
  }
  @Input() endDate: Date;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;

  private NEW_METRICS_RELEASE_DATE = new Date(2024, 5, 2);
  public _displayNewMetrics = false;

  private _order = '-date_id';
  private _startDate: Date;
  private _reportType = KalturaReportType.epWebcastEngagement;
  private _cncReportType = KalturaReportType.cncParticipation;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _cncFilter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public _engagementRate = 0;
  public _reactionsRate = 0;
  public _reactionsCount = '0';
  public _messagesRate = 0;
  public _messagesCount = '0';
  public _questionsRate = 0;
  public _questionsCount = '0';
  public _downloadRate = 0;
  public _downloadCount = '0';
  public _pollsRate = 0;

  private uniqueViewersCount = 0;

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              _dataConfigService: MiniEngagementConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._cncDataConfig = _dataConfigService.getCncConfig();
  }

  ngOnInit(): void {
    this._displayNewMetrics = this._startDate.getTime() > this.NEW_METRICS_RELEASE_DATE.getTime();
    this._loadReport();
  }

  private _loadReport(sections = this._dataConfig, cncSections = this._cncDataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this._startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;

    this._cncFilter.contextIdIn = this.entryIdIn;
    this._cncFilter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._cncFilter.fromDate = Math.floor(this._startDate.getTime() / 1000);
    this._cncFilter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._cncFilter.interval = KalturaReportInterval.days;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    const cncReportConfig: ReportConfig = { reportType: this._cncReportType, filter: this._cncFilter, order: this._order };
    const reportRequest = this._reportService.getReport(reportConfig, sections, false);
    const cncReportRequest = this._reportService.getReport(cncReportConfig, cncSections, false);

    forkJoin({reportRequest, cncReportRequest}).subscribe(
      ({reportRequest, cncReportRequest}) => {
        if (reportRequest.totals) {
          this._handleTotals(reportRequest.totals); // handle totals
        }
        if (cncReportRequest.totals) {
          this._handleCncTotals(cncReportRequest.totals); // handle totals
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
      }
    );

  }

  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    this.uniqueViewersCount = tabsData[5].rawValue !== '' ? parseInt(tabsData[5].rawValue.toString()) : 0;
    if (this.uniqueViewersCount > 0) {
      this._engagementRate = tabsData[0].rawValue !== '' ? ReportHelper.precisionRound(tabsData[0].rawValue as number * 100, 1) : 0;
      this._reactionsRate = tabsData[1].rawValue !== '' ? ReportHelper.precisionRound(tabsData[1].rawValue as number / this.uniqueViewersCount * 100, 1) : 0;
      this._reactionsCount = tabsData[2].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[2].rawValue as number) : '0';
      this._downloadRate = tabsData[3].rawValue !== '' ? ReportHelper.precisionRound(tabsData[3].rawValue as number / this.uniqueViewersCount * 100, 1) : 0;
      this._downloadCount = tabsData[4].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[4].rawValue as number) : '0';
    }

  }

  private _handleCncTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._cncDataConfig.totals);

    if (this.uniqueViewersCount > 0) {
      /*
      if (tabsData[0].rawValue !== '') {
        this._reactionsRate = ReportHelper.precisionRound(tabsData[0].rawValue as number / totalUsers * 100, 2); // update reactions rate
      }
      if (tabsData[1].rawValue !== '') {
        this._reactionsCount = ReportHelper.numberOrZero(tabsData[1].rawValue as number); // update reactions count
      }*/
      const uniqueLoggedInUsers = tabsData[7].rawValue !== '' ? parseInt(tabsData[7].rawValue.toString()) : 0;
      this._messagesRate = tabsData[2].rawValue !== '' ? ReportHelper.precisionRound(tabsData[2].rawValue as number / uniqueLoggedInUsers * 100, 1) : 0;
      this._messagesCount = tabsData[3].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[3].rawValue as number) : '0';
      this._questionsRate = tabsData[4].rawValue !== '' ? ReportHelper.precisionRound(tabsData[4].rawValue as number / uniqueLoggedInUsers * 100, 1) : 0;
      this._questionsCount = tabsData[5].rawValue !== '' ? ReportHelper.numberOrZero(tabsData[5].rawValue as number) : '0';
      this._pollsRate = tabsData[6].rawValue !== '' ? ReportHelper.precisionRound(tabsData[6].rawValue as number / uniqueLoggedInUsers * 100, 1) : 0;
    }
  }

}
