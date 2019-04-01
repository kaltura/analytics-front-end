import { Component, OnDestroy } from '@angular/core';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, of as ObservableOf } from 'rxjs';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { SourcesDataConfig } from './sources-data.config';
import { TrendService } from 'shared/services/trend.service';
import { TopContributorsBaseReportComponent } from '../top-contributors-base-report/top-contributors-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Component({
  selector: 'app-contributors-sources',
  templateUrl: './sources.component.html',
  styleUrls: ['./sources.component.scss'],
  providers: [
    KalturaLogger.createLogger('ContributorsSourcesComponent'),
    ReportService,
    SourcesDataConfig,
  ]
})
export class ContributorsSourcesComponent extends TopContributorsBaseReportComponent implements OnDestroy{
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _pager = new KalturaFilterPager();
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false,
    interval: this._reportInterval,
  });
  
  protected _componentId = 'sources';
  public topSources$: BehaviorSubject<{table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException}> = new BehaviorSubject({table: null, compare: null, busy: false, error: null});

  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = true;
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _compareFirstTimeLoading = true;
  public _reportType = KalturaReportType.topSources;
  public _barChartData: any = {};
  public _selectedMetrics: string;
  public _tabsData: Tab[] = [];
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _trendService: TrendService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: SourcesDataConfig,
              private _logger: KalturaLogger) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this.topSources$.next({table: null, compare: null, busy: true, error: null});
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: null };
    this._reportService.getReport(reportConfig)
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
        return this._reportService.getReport(compareReportConfig)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._barChartData = {};

          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table, compare); // handle table
            this.topSources$.next({table: report.table, compare: compare && compare.table ? compare.table : null, busy: false, error: null});
          } else {
            this.topSources$.next({table: null, compare: null, busy: false, error: null});
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
          this.topSources$.next({ table: null, compare: null, busy: false, error: error });
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._isCompareMode = false;
    if (this._dateFilter.compare.active) {
      this._isCompareMode = true;
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
      this._compareFirstTimeLoading = true;
    }
  }
  
  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
  }

  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    this._tabsData = this._reportService.parseTotals(table, this._dataConfig.totals, this._selectedMetrics);
  
    const columnsCount = table.data ? table.data.split(';').length : 0;
    const graphOptions = { xAxisLabelRotation: columnsCount > 3 ? 45 : 0 };
    if (compare && compare.table && compare.table.header && compare.table.data) {
      const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
      const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
      const getSource = arr => arr.map(({ source }) => source);
      const uniqueSourcesKeys = Array.from(new Set([...getSource(tableData), ...getSource(compareTableData)]));

      // produce { source: 'sourceName', key_from_config1: 0, key_from_config2: 0...} object
      const getEmptySource = source =>
        Object
          .keys(this._dataConfig[ReportDataSection.graph].fields)
          .reduce((result, key) => (result[key] = 0, result), { source });

      // append missing sources to both current and compare tables
      uniqueSourcesKeys.forEach(source => {
        if (!tableData.find(item => item.source === source)) {
          tableData.push(getEmptySource(source));
        }
  
        if (!compareTableData.find(item => item.source === source)) {
          compareTableData.push(getEmptySource(source));
        }
      });
  
      const currentData = this._reportService.convertTableDataToGraphData(tableData, this._dataConfig);
      const compareData = this._reportService.convertTableDataToGraphData(compareTableData, this._dataConfig);
      const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
      const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
      const { barChartData } = this._compareService.compareGraphData(
        currentPeriod,
        comparePeriod,
        currentData,
        compareData,
        this._dataConfig.graph,
        this._reportInterval,
        null,
        graphOptions
      );
      this._barChartData = barChartData;
      this._compareFirstTimeLoading = false;
    } else {
      this._barChartData = this._reportService.getGraphDataFromTable(
        table,
        this._dataConfig,
        { from: this._filter.fromDate, to: this._filter.toDate },
        this._reportInterval,
        graphOptions
        ).barChartData;
    }
  }

  ngOnDestroy() {
    this.topSources$.complete();
  }
}
