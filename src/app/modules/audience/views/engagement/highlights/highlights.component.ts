import { Component, Input } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { HighlightsConfig } from './highlights.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';

@Component({
  selector: 'app-engagement-highlights',
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss'],
  providers: [HighlightsConfig, ReportService]
})
export class EngagementHighlightsComponent extends EngagementBaseReportComponent {
  @Input() dateFilterComponent: DateFilterComponent;
  
  private _order = '-count_plays';
  private _reportType = KalturaReportType.userEngagement;
  private _dataConfig: ReportDataConfig;
  private _selectedUsers = '';
  
  public _columns: string[] = [];
  public _isBusy: boolean;
  public _chartDataLoaded = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _tableData: any[] = [];
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartType = 'line';
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _lineChartData = {};
  public _showTable = false;
  public _totalCount = 0;
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
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: HighlightsConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._tableData = [];
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            // if (report.table && report.table.header && report.table.data) {
            //   this.handleTable(report.table); // handle table
            // }
            if (report.graphs.length) {
              this._chartDataLoaded = false;
              this._handleTable2(report.graphs);
              this._handleGraphs(report.graphs); // handle graphs
            }
            if (report.totals) {
              this._handleTotals(report.totals); // handle totals
            }
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
    this._chartDataLoaded = false;
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDay = this._dateFilter.startDay;
    this._filter.toDay = this._dateFilter.endDay;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = new KalturaEndUserReportInputFilter({
        searchInTags: true,
        searchInAdminTags: false,
        timeZoneOffset: this._dateFilter.timeZoneOffset,
        interval: this._dateFilter.timeUnits,
        fromDay: compare.startDay,
        toDay: compare.endDay,
      });
    } else {
      this._compareFilter = null;
    }
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDay, to: this._filter.toDay };
    const comparePeriod = { from: this._compareFilter.fromDay, to: this._compareFilter.toDay };
    
    if (current.table && compare.table) {
      const { columns, tableData } = this._compareService.compareTableData(
        currentPeriod,
        comparePeriod,
        current.table,
        compare.table,
        this._dataConfig.table
      );
      this._totalCount = current.table.totalCount;
      this._columns = columns;
      this._tableData = tableData;
    }
    
    if (current.totals && compare.totals) {
      this._tabsData = this._compareService.compareTotalsData(
        currentPeriod,
        comparePeriod,
        current.totals,
        compare.totals,
        this._dataConfig.totals,
        this._selectedMetrics
      );
    }
    
    if (current.graphs.length && compare.graphs.length) {
      const { lineChartData } = this._compareService.compareGraphData(
        currentPeriod,
        comparePeriod,
        current.graphs,
        compare.graphs,
        this._dataConfig.graph,
        this._reportInterval,
        () => this._chartDataLoaded = true
      );
      this._lineChartData = lineChartData;
    }
  }
  
  private handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData;
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }
  
  private _handleTable2(graphs: KalturaReportGraph[]): void {
    const config = this._dataConfig.table;
    const fields = config.fields;
    const temp = {};
    graphs.forEach((graph: KalturaReportGraph) => {
      if (!fields[graph.id]) {
        return;
      }
      let dates = [];
      let values = [];
      const data = graph.data.split(';');
    
      data.forEach((value) => {
        if (value.length) {
          const label = value.split(',')[0];
          const name = DateFilterUtils.formatMonthString(label, analyticsConfig.locale, 'short');
          let val = Math.ceil(parseFloat(value.split(',')[1])); // publisher storage report should round up graph values
          if (isNaN(val)) {
            val = 0;
          }
        
          if (config.fields[graph.id]) {
            val = fields[graph.id].format(val);
          }
        
          dates.push(name);
          values.push(val);
        }
      });
      temp[graph.id] = { dates, values };
    });
  
    const tableData = [];
    if (temp['count_plays']) {
      temp['count_plays'].dates.forEach((date, index) => {
        tableData.push({
          'name': date,
          'count_plays': fields['count_plays'] ? fields['count_plays'].format(temp['count_plays'].values[index]) : 0,
          'sum_time_viewed': fields['sum_time_viewed'] ? fields['sum_time_viewed'].format(temp['sum_time_viewed'].values[index]) : 0,
          'unique_known_users': temp['unique_known_users'] ? fields['unique_known_users'].format(temp['unique_known_users'].values[index]) : 0,
          'avg_view_drop_off': temp['avg_view_drop_off'] ? fields['avg_view_drop_off'].format(temp['avg_view_drop_off'].values[index]) : 0,
        });
      });
    }
  
    this._columns = ['name', ...Object.keys(temp)];
    this._tableData = tableData;
    
  }
  
  private _handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      this._reportInterval,
      () => this._chartDataLoaded = true
    );
    this._lineChartData = lineChartData;
  }
  
  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
  }
  
  public _toggleTable(): void {
    this._showTable = !this._showTable;
    if (analyticsConfig.callbacks && analyticsConfig.callbacks.updateLayout) {
      analyticsConfig.callbacks.updateLayout();
    }
  }
  
  public _onPaginationChanged(event: any): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._loadReport({ table: null });
    }
  }
  
  public _onSortChanged(event) {
    if (event.data.length && event.field && event.order && !this._isCompareMode) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._loadReport({ table: null });
      }
    }
  }
}
