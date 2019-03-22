import { Component, OnDestroy } from '@angular/core';
import { AuthService, ErrorDetails, ErrorsManagerService, GraphsData, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import {BehaviorSubject, of as ObservableOf} from 'rxjs';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig, ReportDataItemConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { SourcesDataConfig } from './sources-data.config';
import { TrendService } from 'shared/services/trend.service';
import { TopContributorsBaseReportComponent } from '../top-contributors-base-report/top-contributors-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BarChartRow } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';

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
  public _barChartData: { [key: string]: BarChartRow[] } = {};
  public _selectedMetrics: string;
  public _tabsData: Tab[] = [];
  public _currentPeriod: { from: number, to: number };
  public _comparePeriod: { from: number, to: number };
  
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
    this._currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
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
          
          if (compare) {
            this._comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
          } else {
            this._comparePeriod = null;
          }

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
  
    if (compare && compare.table && compare.table.header && compare.table.data) {
      const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
      const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
      
      this._compareFirstTimeLoading = false;
    } else {
    
    }
  }

  ngOnDestroy() {
    this.topSources$.complete();
  }
}
