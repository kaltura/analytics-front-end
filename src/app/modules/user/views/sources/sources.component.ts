import {Component, Input, OnDestroy} from '@angular/core';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, of as ObservableOf } from 'rxjs';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { SourcesDataConfig } from './sources-data.config';
import { TrendService } from 'shared/services/trend.service';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BarChartRow } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { UserBase } from "../user-base/user-base";
import {RefineFilter} from "shared/components/filter/filter.component";
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-sources',
  templateUrl: './sources.component.html',
  styleUrls: ['./sources.component.scss'],
  providers: [
    KalturaLogger.createLogger('UserSourcesComponent'),
    ReportService,
    SourcesDataConfig,
  ]
})
export class UserSourcesComponent extends UserBase implements OnDestroy {
  private _compareFilter: KalturaEndUserReportInputFilter = null;
  private _pager = new KalturaFilterPager();
  private _dataConfig: ReportDataConfig;
  private _reportInterval = KalturaReportInterval.months;
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false,
    interval: this._reportInterval,
  });
  private _currentPeriodLabel: string;
  private _comparePeriodLabel: string;
  
  protected _componentId = 'sources';
  public topSources$: BehaviorSubject<{ table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }> = new BehaviorSubject({ table: null, compare: null, busy: false, error: null });
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = true;
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _compareFirstTimeLoading = true;
  public _reportType = reportTypeMap(KalturaReportType.topSources);
  public _barChartData: { [key: string]: BarChartRow[] } = {};
  public _selectedMetrics: string;
  public _tabsData: Tab[] = [];
  public _currentPeriod: { from: number, to: number };
  public _comparePeriod: { from: number, to: number };
  public _colorScheme: string;

  @Input() set userId(value: string) {
    if (value) {
      this._filter.ownerIdsIn = value;
    }
  }

  @Input() public userName = '';

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
    this._onTabChange({ key: this._dataConfig.totals.preSelected } as Tab);
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
    this._currentPeriodLabel = this._getPeriodLabel(this._currentPeriod);
    this._isBusy = true;
    this._blockerMessage = null;
    this.topSources$.next({ table: null, compare: null, busy: true, error: null });
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: null };
    this._reportService.getReport(reportConfig)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
  
        this._compareFilter.ownerIdsIn = this._filter.ownerIdsIn;
        
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
            this._comparePeriodLabel = this._getPeriodLabel(this._comparePeriod);
          } else {
            this._comparePeriod = null;
            this._comparePeriodLabel = '';
          }
          
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table, compare); // handle table
            this.topSources$.next({ table: report.table, compare: compare && compare.table ? compare.table : null, busy: false, error: null });
          } else {
            this.topSources$.next({ table: null, compare: null, busy: false, error: null });
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
    this._colorScheme = this._dataConfig[ReportDataSection.graph].fields[tab.key].colors[0];
  }
  
  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    this._tabsData = this._reportService.parseTotals(table, this._dataConfig.totals, this._selectedMetrics);
    
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    const columns = Object.keys(this._dataConfig[ReportDataSection.graph].fields);
  
    const getTotals = tData => {
      return columns.reduce((data: { [key: string]: number; }, key: string) => {
        data[key] = tData.map(item => parseFloat(item[key])).reduce((acc, val) => acc + val, 0);
        return data;
      }, {});
    };

    const totals = getTotals(tableData);

    if (compare && compare.table && compare.table.header && compare.table.data) {
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

      const compareTotals = getTotals(compareTableData);
      this._compareFirstTimeLoading = false;
  
      this._barChartData = columns.reduce((data: { [key: string]: BarChartRow[] }, key: string) => {
        data[key] = tableData.map((item, index) => {
          const compareItem = compareTableData.find(cItem => cItem.source === item.source) || { [key]: '0' };
          const current = parseFloat(item[key]);
          const compare = parseFloat(compareItem[key]);
  
          const { value, direction } = this._trendService.calculateTrend(current, compare);
          const trend = {
            value: value !== null ? value : '–',
            trend: direction,
            units: value !== null ? '%' : '',
            tooltip: `${this._trendService.getTooltipRowString(this._currentPeriodLabel, ReportHelper.numberOrZero(current))}${this._trendService.getTooltipRowString(this._comparePeriodLabel, ReportHelper.numberOrZero(compare))}`,
          };

          return {
            trend,
            index: index + 1,
            label: item.source,
            value: [
              ReportHelper.percents(parseFloat(item[key]) / totals[key], true, false, false),
              ReportHelper.percents(parseFloat(compareItem[key]) / compareTotals[key], true, false, false),
            ],
            tooltip: [
              { value: ReportHelper.numberOrZero(item[key]), label: this._translate.instant(`app.contributors.${key}`) },
              { value: ReportHelper.numberOrZero(compareItem[key]), label: this._translate.instant(`app.contributors.${key}`) }
            ],
          };
        });
        return data;
      }, {});

    } else {
      this._barChartData = columns.reduce((data: { [key: string]: BarChartRow[] }, key: string) => {
        data[key] = tableData.map((item, index) => {
          return {
            index: index + 1,
            label: item.source,
            value: ReportHelper.percents(parseFloat(item[key]) / totals[key], true, false, false),
            tooltip: { value: ReportHelper.numberOrZero(item[key]), label: this._translate.instant(`app.contributors.${key}`) }
          };
        });
        return data;
      }, {});
    }
  }
  
  private _getPeriodLabel(period: { from: number, to: number }): string {
    return `${DateFilterUtils.formatMonthDayString(period.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(period.to, analyticsConfig.locale)}`;
  }
  
  ngOnDestroy() {
    this.topSources$.complete();
  }
}
