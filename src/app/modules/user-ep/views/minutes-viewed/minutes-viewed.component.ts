import { Component, Input, OnInit } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { forkJoin } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { MinutesViewedConfig } from './minutes-viewed.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { analyticsConfig } from "configuration/analytics-config";

@Component({
  selector: 'app-ep-user-minutes-viewed',
  templateUrl: './minutes-viewed.component.html',
  styleUrls: ['./minutes-viewed.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpUserMinutesViewedComponent'),
    MinutesViewedConfig,
    ReportService,
  ]
})
export class EpUserMinutesViewedComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'ep-user-minutes-viewed';

  @Input() eventId = '';
  @Input() userId = '';
  @Input() set startDate(value: Date) {
    this._startDate = value;
    setTimeout(() => this._loadReport(), 0);
  }
  @Input() endDate: Date;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _codTabsData: Tab[] = [];
  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastHighlights;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });

  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _codFilter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public _livePercent = 0;
  public _recordingPercent = 0;
  public _codPercent = 0; // content on demand
  private _startDate: Date;
  private totalMinutesViews = 0;

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              _dataConfigService: MinutesViewedConfig) {

    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    this._filter.virtualEventIdIn = this.eventId;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this._startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    this._filter.userIds = this.userId;
    this._filter.eventSessionContextIdIn = analyticsConfig.customData?.eventSessionEntries || '';

    this._codFilter.virtualEventIdIn = this.eventId;
    this._codFilter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._codFilter.fromDate = Math.floor(this._startDate.getTime() / 1000);
    this._codFilter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._codFilter.interval = KalturaReportInterval.days;
    this._codFilter.userIds = this.userId;
    this._codFilter.categories = analyticsConfig.customData?.eventContentCategoryFullName || '';

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    const codReportConfig: ReportConfig = { reportType: this._reportType, filter: this._codFilter, order: this._order };

    const reportRequest = this._reportService.getReport(reportConfig, sections, false);
    const codReportRequest = this._reportService.getReport(codReportConfig, sections, false);

    forkJoin({reportRequest, codReportRequest}).subscribe(
      ({reportRequest, codReportRequest}) => {
        if (reportRequest.totals) {
          this._handleTotals(reportRequest.totals); // handle totals
        }
        if (codReportRequest.totals) {
          this._handleCodTotals(codReportRequest.totals); // handle totals
        }
        this.calculatePercentage();
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
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);

  }

  private _handleCodTotals(totals: KalturaReportTotal): void {
    this._codTabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    if (this._codTabsData.length > 1) {
      this._codPercent = parseFloat(this._codTabsData[0].value) < parseFloat(this._codTabsData[1].value) ? 100 : parseFloat(this._codTabsData[1].value) / parseFloat(this._codTabsData[0].value) * 100;
    }
  }

  private calculatePercentage(): void {
    if (this._tabsData.length > 1) {
      this.totalMinutesViews = parseFloat(this._tabsData[0].value) + parseFloat(this._tabsData[1].value);
    }
    if (this._codTabsData.length > 1) {
      this.totalMinutesViews += parseFloat(this._codTabsData[1].value);
    }
    this._livePercent = parseFloat(this._tabsData[0].value) / this.totalMinutesViews * 100;
    this._recordingPercent = parseFloat(this._tabsData[1].value) / this.totalMinutesViews * 100;
    this._codPercent = parseFloat(this._codTabsData[1].value) / this.totalMinutesViews * 100;


  }

}
