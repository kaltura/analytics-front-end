import { Component } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { KalturaFilterPager, KalturaReportGraph, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { UsersDataConfig } from './users-data.config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { TrendService } from 'shared/services/trend.service';

@Component({
  selector: 'app-engagement-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [ReportService, UsersDataConfig]
})
export class EngagementUsersComponent extends EngagementBaseReportComponent {
  private _compareFilter: KalturaReportInputFilter = null;
  private _pager = new KalturaFilterPager();
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _filter = new KalturaReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false,
    interval: this._reportInterval,
  });
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = true;
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _compareFirstTimeLoading = true;
  public _reportType = KalturaReportType.uniqueUsersPlay;
  public _barChartData: any = {};
  public _totalUsers = 0;
  public _totalUsersCompare: {
    trend: number,
    tooltip: string,
    value: string,
    units: string
  } = null;
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _trendService: TrendService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: UsersDataConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: null };
    this._reportService.getReport(reportConfig, { graph: null })
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = {
          reportType: this._reportType,
          filter: this._compareFilter,
          pager: this._pager,
          order: null
        };
        return this._reportService.getReport(compareReportConfig, { graph: null })
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._barChartData = {};

          if (compare) {
            this._handleCompare(report, compare);
          } else if (report.table && report.table.header && report.table.data) {
            this._handleGraph(report.table); // handle table
          }
          
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if (err.forceLogout) {
            buttons = [{
              label: this._translate.instant('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
                this._authService.logout();
              }
            }];
          } else {
            buttons = [{
              label: this._translate.instant('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            },
              {
                label: this._translate.instant('app.common.retry'),
                action: () => {
                  this._loadReport();
                }
              }];
          }
          this._blockerMessage = new AreaBlockerMessage({
            title: err.title,
            message: err.message,
            buttons
          });
        });
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDay = this._dateFilter.startDay;
    this._filter.toDay = this._dateFilter.endDay;
    this._isCompareMode = false;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._isCompareMode = true;
      this._compareFilter = new KalturaReportInputFilter(
        {
          searchInTags: true,
          searchInAdminTags: false,
          timeZoneOffset: this._dateFilter.timeZoneOffset,
          interval: this._dateFilter.timeUnits,
          fromDay: compare.startDay,
          toDay: compare.endDay,
        }
      );
    } else {
      this._compareFilter = null;
      this._compareFirstTimeLoading = true;
    }
  }
  
  private _handleGraph(table: KalturaReportTable): void {
    const graphs = [{ id: 'default', data: table.data } as KalturaReportGraph];
    const { barChartData } = this._reportService.parseGraphs(graphs, this._dataConfig.graph, this._reportInterval);
    this._barChartData = barChartData['default'];
  
    this._totalUsers = this._barChartData.series[0].data.reduce((a, b) => a + b, 0);
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDay, to: this._filter.toDay };
    const comparePeriod = { from: this._compareFilter.fromDay, to: this._compareFilter.toDay };
    
    if (current.table && compare.table) {
      const currentGraph = [{ id: 'default', data: current.table.data } as KalturaReportGraph];
      const compareGraph = [{ id: 'default', data: compare.table.data } as KalturaReportGraph];
      const { barChartData } = this._compareService.compareGraphData(
        currentPeriod,
        comparePeriod,
        currentGraph,
        compareGraph,
        this._dataConfig.graph,
        this._reportInterval
      );

      this._barChartData = null;

      if (barChartData['default']) {
        this._barChartData = barChartData['default'];
  
        const currentTotal = this._barChartData.series[0].data.reduce((a, b) => a + b, 0);
        const compareTotal = this._barChartData.series[1].data.reduce((a, b) => a + b, 0);
  
        const currentPeriodTitle = `${DateFilterUtils.formatMonthString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthString(currentPeriod.to, analyticsConfig.locale)}`;
        const comparePeriodTitle = `${DateFilterUtils.formatMonthString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthString(comparePeriod.to, analyticsConfig.locale)}`;
        const { value, direction: trend } = this._trendService.calculateTrend(currentTotal, compareTotal);
  
        const tooltip = `
        ${this._trendService.getTooltipRowString(currentPeriodTitle, currentTotal, '')}
        ${this._trendService.getTooltipRowString(comparePeriodTitle, compareTotal, '')}
      `;
  
        this._totalUsersCompare = {
          trend,
          value,
          tooltip,
          units: '%'
        };
      }
    }
  }
}
