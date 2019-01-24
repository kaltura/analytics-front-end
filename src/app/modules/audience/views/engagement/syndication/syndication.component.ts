import { Component } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { SyndicationDataConfig } from './syndication-data.config';
import { TrendService } from 'shared/services/trend.service';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { significantDigits } from 'shared/utils/significant-digits';

@Component({
  selector: 'app-engagement-syndication',
  templateUrl: './syndication.component.html',
  styleUrls: ['./syndication.component.scss'],
  providers: [ReportService, SyndicationDataConfig]
})
export class SyndicationComponent extends EngagementBaseReportComponent {
  private _totalPlaysCount = 0;
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _order = '-count_plays';
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false,
    interval: this._reportInterval,
  });
  
  protected _componentId = 'syndication';
  
  public _drillDown: string = null;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = true;
  public _selectedMetrics: string;
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _reportType = KalturaReportType.topSyndication;
  public _lineChartData: any = {};
  public _totalUsers = null;
  public _tableData: any[] = [];
  public _tabsData: Tab[] = [];
  public _totalCount: number;
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: 5 });
  public _distributionColorScheme: string;
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _trendService: TrendService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: SyndicationDataConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._tableData = [];
    const reportConfig: ReportConfig = {
      reportType: this._reportType,
      filter: this._filter,
      pager: this._pager,
      order: this._order,
      objectIds: this._drillDown
    };
    this._reportService.getReport(reportConfig, sections)
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
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._totalUsers = null;
          this._totalCount = 0;
          
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            // IMPORTANT to handle totals first, distribution rely on it
            if (report.totals) {
              this._handleTotals(report.totals); // handle totals
            }
            if (report.table && report.table.header && report.table.data) {
              this._handleTable(report.table); // handle table
            }
            if (report.graphs.length) {
              this._handleGraphs(report.graphs); // handle graphs
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
  
  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDay = this._dateFilter.startDay;
    this._filter.toDay = this._dateFilter.endDay;
    this._isCompareMode = false;
    if (this._dateFilter.compare.active) {
      this._isCompareMode = true;
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDay = compare.startDay;
      this._compareFilter.toDay = compare.endDay;
    } else {
      this._compareFilter = null;
    }
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    if (this._tabsData.length) {
      this._totalPlaysCount = Number(this._tabsData[0].rawValue);
    }
  }
  
  private _handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData } = this._reportService.parseGraphs(graphs, this._dataConfig.graph, this._reportInterval);
    this._lineChartData = lineChartData;
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
        this._dataConfig.table,
        'object_id'
      );
      this._totalCount = current.table.totalCount;
      this._columns = columns;
      this._tableData = tableData.map((row, index) => {
        row['index'] = String(1 + index + (this._pager.pageIndex - 1) * this._pager.pageSize);
        return row;
      });
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
        this._reportInterval
      );
      this._lineChartData = lineChartData;
    }
  }
  
  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._insertColumnAfter('plays_distribution', 'count_plays', columns);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData.map((row, index) => {
      let playsDistribution = 0;
      if (this._totalPlaysCount !== 0) {
        const countPlays = parseFloat(row['count_plays']) || 0;
        playsDistribution = (countPlays / this._totalPlaysCount) * 100;
      }
      playsDistribution = significantDigits(playsDistribution);
      row['index'] = String(1 + index + (this._pager.pageIndex - 1) * this._pager.pageSize);
      row['count_plays'] = ReportHelper.numberOrZero(row['count_plays']);
      row['plays_distribution'] = ReportHelper.numberWithCommas(playsDistribution);
    
      return row;
    });
  }
  
  private _insertColumnAfter(column: string, after: string, columns: string[]): void {
    const countPlaysIndex = columns.indexOf(after);
    if (countPlaysIndex !== -1) {
      columns.splice(countPlaysIndex + 1, 0, column);
    }
  }
  
  public _onPaginationChanged(event): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._loadReport({ table: null });
    }
  }
  
  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
  
    switch (this._selectedMetrics) {
      case 'sum_time_viewed':
        this._distributionColorScheme = 'time';
        break;
      case 'avg_view_drop_off':
        this._distributionColorScheme = 'dropoff';
        break;
      default:
        this._distributionColorScheme = 'default';
        break;
    }
  }
  
  public _onSortChanged(event) {
    const field = event.field === 'plays_distribution' ? 'count_plays' : event.field;
    if (event.data.length && field && event.order) {
      const order = event.order === 1 ? '+' + field : '-' + field;
      if (order !== this._order) {
        this._order = order;
        this._pager.pageIndex = 1;
        this._loadReport({ table: null });
      }
    }
  }
  
  public _onDrillDown(domain: string): void {
    this._drillDown = domain;
    this._pager.pageIndex = 1;
    this._loadReport();
  }
}
