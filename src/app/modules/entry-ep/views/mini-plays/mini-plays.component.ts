import { Component, Input, OnInit } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportGraph, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { MiniPlaysConfig } from './mini-plays.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from "configuration/analytics-config";
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { FrameEventManagerService, FrameEvents } from "shared/modules/frame-event-manager/frame-event-manager.service";
import { PageScrollConfig, PageScrollInstance, PageScrollService } from "ngx-page-scroll";

@Component({
  selector: 'app-ep-mini-plays',
  templateUrl: './mini-plays.component.html',
  styleUrls: ['./mini-plays.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpMiniPlaysComponent'),
    MiniPlaysConfig,
    ReportService,
  ]
})
export class EpMiniPlaysComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  protected _componentId = 'ep-mini-plays';

  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() endDate: Date;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  private _order = '-date_id';
  private _reportType = KalturaReportType.userTopContent;
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _lineChartData: any = {};

  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _browserService: BrowserService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _frameEventManager: FrameEventManagerService,
              private pageScrollService: PageScrollService,
              private _dataConfigService: MiniPlaysConfig,
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
    this._filter.fromDate = DateFilterUtils.toServerDate(this.startDate, true);
    this._filter.toDate = DateFilterUtils.toServerDate(this.endDate, false);
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
          if (report.graphs.length) {
            this._handleGraphs(report.graphs); // handle graphs
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
  }

  private _handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this._filter.fromDate, to: this._filter.toDate },
      this._reportInterval
    );
    this._lineChartData = lineChartData['count_plays'];
    this._lineChartData.xAxis.show = false;
    this._lineChartData.xAxis.boundaryGap = true;
    this._lineChartData.yAxis.show = false;
    this._lineChartData.grid = {
      top: 0, left: 0, bottom: 0, right: 0, containLabel: true
    };
    this._lineChartData.series[0].areaStyle = {
      color: "#E6ECF9"
    };
  }

  public scrollTo(target: string): void {
    this._logger.trace('Handle scroll to details report action by user', { target });
    if (analyticsConfig.isHosted) {
      const targetEl = document.getElementById(target.substr(1)) as HTMLElement;
      if (targetEl) {
        this._logger.trace('Send scrollTo event to the host app', { offset: targetEl.offsetTop });
        this._frameEventManager.publish(FrameEvents.ScrollTo, targetEl.offsetTop);
      }
    } else {
      PageScrollConfig.defaultDuration = 500;
      const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(document, target);
      this.pageScrollService.start(pageScrollInstance);
    }
  }

}
