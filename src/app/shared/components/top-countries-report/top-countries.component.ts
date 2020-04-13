import { Component, EventEmitter, Inject, InjectionToken, Input, OnDestroy, OnInit, Output, Self, ViewChild } from '@angular/core';
import {
  KalturaAPIException,
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaObjectBaseFactory,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportTotal,
  KalturaReportType
} from 'kaltura-ngx-client';
import { AuthService, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { ReportDataBaseConfig, ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { TopCountriesConfig } from './top-countries.config';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { TrendService } from 'shared/services/trend.service';
import { HttpClient } from '@angular/common/http';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { analyticsConfig } from 'configuration/analytics-config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { significantDigits } from 'shared/utils/significant-digits';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { GeoComponent } from './geo/geo.component';
import { map, switchMap } from 'rxjs/operators';
import {BehaviorSubject, of as ObservableOf} from 'rxjs';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { QueryBase } from "shared/components/query-base/query-base";

@Component({
  selector: 'app-top-countries',
  templateUrl: './top-countries.component.html',
  styleUrls: ['./top-countries.component.scss'],
  providers: [TopCountriesConfig, ReportService]
})
export class TopCountriesComponent extends QueryBase implements OnInit, OnDestroy {
  @Input() categoryId: string = null;
  @Input() entryId: string = null;
  
  @ViewChild('categoryGeo', { static: false }) _categoryGeo: GeoComponent;
  @ViewChild('categoryCompareGeo', { static: false }) _categoryCompareGeo: GeoComponent;

  @Output() onDrillDown = new EventEmitter<{ reportType: KalturaReportType, drillDown: string[] }>();
  
  @Input() _distributionKey = 'loads_distribution';
  @Input() _distributionCalculationKey = 'count_loads';
  
  private _dataConfig: ReportDataConfig;
  private _mapCenter = [0, 10];
  private _order = `-${this._distributionCalculationKey}`;
  private _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });

  protected _componentId = 'top-geo';
  
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = [];
  public _selectedMetrics: string;
  public _reportInterval = KalturaReportInterval.days;
  public _tableData: TableRow<any>[] = [];
  public _compareTableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _compareTabsData: Tab[] = [];
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;
  public _reportType = reportTypeMap(KalturaReportType.mapOverlayCountry);
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _drillDown: string[] = [];
  public _mapData: any;
  public _currentPeriodTitle: string;
  public _comparePeriodTitle: string;
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  public topCountries$: BehaviorSubject<{ table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }> = new BehaviorSubject({ table: null, compare: null, busy: false, error: null });
  
  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _trendService: TrendService,
              private _http: HttpClient,
              private _dataConfigService: TopCountriesConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  ngOnDestroy() {
    this.topCountries$.complete();
  }
  
  ngOnInit() {
    this._isBusy = false;
    // load works map data
    this._http.get('assets/world.json')
      .subscribe(data => {
        this._mapData = data;
      });
  }
  
  protected _updateRefineFilter(): void {
    this._drillDownTop(false);
    
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _updateFilter(): void {
    this._drillDownTop(false);

    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    if (this._drillDown.length === 0) {
      this.topCountries$.next({table: null, compare: null, busy: true, error: null});
    }
    this._isBusy = true;
    this._setMapCenter();
    this._tableData = [];
    this._compareTableData = [];
    this._blockerMessage = null;
    
    this._order = `-${this._distributionCalculationKey}`;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._updateReportConfig(reportConfig);
  
    if (this.entryId) {
      this._filter.entryIdIn = this.entryId;
    }
    if (this.categoryId && !this._filter.categoriesIdsIn && !this._filter.playbackContextIdsIn) {
      this._filter.categoriesIdsIn = this.categoryId;
    }
    
    this._reportService.getReport(reportConfig, sections)
      .pipe(
        cancelOnDestroy(this),
        switchMap(report => {
          if (!this._isCompareMode) {
            return ObservableOf({ report, compare: null });
          }
          
          const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
          this._updateReportConfig(compareReportConfig);
          
          if (this.entryId) {
            this._compareFilter.entryIdIn = this.entryId;
          }
          if (this.categoryId && !this._compareFilter.categoriesIdsIn && !this._compareFilter.playbackContextIdsIn) {
            this._compareFilter.categoriesIdsIn = this.categoryId;
          }
          
          return this._reportService.getReport(compareReportConfig, this._dataConfig)
            .pipe(map(compare => ({ report, compare })));
        })
      )
      .subscribe(({ report, compare }) => {
          this._isBusy = false;
    
          if (report.totals) {
            this._tabsData = this._handleTotals(report.totals); // handle totals
          }
    
          if (report.table && report.table.header && report.table.data) {
            this._tableData = this._handleTable(report.table, this._tabsData); // handle table
            if (this._drillDown.length === 0) {
              this.topCountries$.next({
                table: report.table,
                compare: compare && compare.table ? compare.table : null,
                busy: false,
                error: null
              });
            }
          } else if (this._drillDown.length === 0) {
            this.topCountries$.next({ table: null, compare: null, busy: false, error: null });
          }
          
          if (compare) {
            this._currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(this._filter.fromDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._filter.toDate, analyticsConfig.locale)}`;
            this._comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(this._compareFilter.fromDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._compareFilter.toDate, analyticsConfig.locale)}`;

            if (compare.totals) {
              this._compareTabsData = this._handleTotals(compare.totals); // handle totals
            }
            if (compare.table && compare.table.header && compare.table.data) {
              this._compareTableData = this._handleTable(compare.table, this._compareTabsData); // handle table
              
              this._tableData.forEach(row => {
                const relevantCompareRow = this._compareTableData.find(item => {
                  const sameCountry = item.country === row.country;
                  const sameRegion = item.region === row.region;
                  const sameCity = item.city === row.city;
                  
                  return sameCountry && sameRegion && sameCity;
                });
                const compareValue = relevantCompareRow ? relevantCompareRow[this._distributionCalculationKey] : 0;
                this._setPlaysTrend(row, this._distributionCalculationKey, compareValue, this._currentPeriodTitle, this._comparePeriodTitle);
              });
            } else {
              this._tableData.forEach(row => {
                this._setPlaysTrend(row, this._distributionCalculationKey, 0, this._currentPeriodTitle, this._comparePeriodTitle);
              });
            }
          }
          
          setTimeout(() => {
            this._categoryGeo.updateMap(this._mapCenter);
            
            if (this._categoryCompareGeo) {
              this._categoryCompareGeo.updateMap(this._mapCenter);
            }
          }, 0);
        },
        error => {
          this._isBusy = false;
          if (this._drillDown.length === 0) {
            this.topCountries$.next({table: null, compare: null, busy: false, error: error});
          }
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
  
  private _setPlaysTrend(row: TableRow, field: string, compareValue: any, currentPeriodTitle: string, comparePeriodTitle: string, units: string = ''): void {
    const currentValue = parseFormattedValue(row[field]);
    compareValue = parseFormattedValue(compareValue.toString());
    const { value, direction } = this._trendService.calculateTrend(currentValue, compareValue);
    const tooltip = `${this._trendService.getTooltipRowString(comparePeriodTitle, ReportHelper.numberWithCommas(compareValue), units)}${this._trendService.getTooltipRowString(currentPeriodTitle, ReportHelper.numberWithCommas(currentValue), units)}`;
    row[field + '_trend'] = {
      trend: value !== null ? value : '–',
      trendDirection: direction,
      tooltip: tooltip,
      units: value !== null ? '%' : '',
    };
  }
  
  private _handleTable(table: KalturaReportTable, tabsData: Tab[]): TableRow[] {
    let { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    // server might return unknown countries with empty object_id. Filter them out.
    // TODO: Will need to change to "Unknown" if inconsistency with total will occur in the future.
    if (this._drillDown.length === 0) {
      tableData = tableData.filter(country => country['object_id']);
    }
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._columns[0] = this._columns.splice(1, 1, this._columns[0])[0]; // switch places between the first 2 columns
    this._columns.unshift('index'); // add line indexing column at the beginning
    let tmp = this._columns.pop();
    this._columns.push('distribution'); // add distribution column at the end
    this._columns.push(tmp);
    
    return tableData.map(row => {
      const calculateDistribution = (key: string): number => {
        const tab = tabsData.find(item => item.key === key);
        const total = tab ? parseFormattedValue(tab.rawValue) : 0;
        const rowValue = parseFormattedValue(row[key]);
        return significantDigits((rowValue / total) * 100);
      };
      const playsDistribution = calculateDistribution(this._distributionCalculationKey);
      row[this._distributionKey] = ReportHelper.numberWithCommas(playsDistribution);
      
      return row;
    });
  }
  
  private _handleTotals(totals: KalturaReportTotal): Tab[] {
    return this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }
  
  private _updateReportConfig(reportConfig: ReportConfig): void {
    const countriesFilterApplied = this._refineFilter.find(({ type }) => type === 'countries') || this._refineFilter.find(({ type }) => type === 'location');
    const regionsFilterApplied = this._refineFilter.find(({ type, value }) => type === 'location' && value['region'] && value['region'].length);
    
    if (!countriesFilterApplied && reportConfig.filter['countryIn']) {
      delete reportConfig.filter['countryIn'];
    }
    if (!regionsFilterApplied && reportConfig.filter['regionIn']) {
      delete reportConfig.filter['regionIn'];
    }
    if (reportConfig['objectIds__null']) {
      delete reportConfig['objectIds__null'];
    }
    reportConfig.objectIds = '';
    
    if (this._drillDown.length > 0) {
      reportConfig.filter.countryIn = this._drillDown[0];
    } else if (countriesFilterApplied) {
      refineFilterToServerValue(this._refineFilter, reportConfig.filter as KalturaEndUserReportInputFilter);
    }
    
    if (this._drillDown.length > 1) {
      reportConfig.filter.regionIn = this._drillDown[1];
    } else if (regionsFilterApplied) {
      refineFilterToServerValue(this._refineFilter, reportConfig.filter as KalturaEndUserReportInputFilter);
    }
  }
  
  private _setMapCenter(): void {
    this._mapCenter = [0, 10];
    if (this._drillDown.length > 0) {
      const location = this._drillDown.length === 1 ? this._drillDown[0] : this._drillDown[1];
      let found = false;
      this._tableData.forEach(data => {
        const name = this._drillDown.length === 1 ? data.country : data.region;
        if (location === name) {
          found = true;
          this._mapCenter = [data['coordinates'].split('/')[1], data['coordinates'].split('/')[0]];
        }
      });
      if (!found && this._tableData.length) {
        this._mapCenter = [this._tableData[0]['coordinates'].split('/')[1], this._tableData[0]['coordinates'].split('/')[0]];
      }
    }
  }
  
  public _onDrillDown(event: { drillDown: string[], reload: boolean }): void {
    const { drillDown, reload } = event;
    this._drillDown = Array.isArray(drillDown) ? drillDown : [drillDown];
    this._reportType = this._drillDown.length === 2 ? reportTypeMap(KalturaReportType.mapOverlayCity) : this._drillDown.length === 1 ? reportTypeMap(KalturaReportType.mapOverlayRegion) : reportTypeMap(KalturaReportType.mapOverlayCountry);

    this.onDrillDown.emit({reportType: this._reportType, drillDown: this._drillDown});

    if (reload) {
      this._loadReport();
    }
  }
  
  public _drillDownTop(reload = true): void {
    if (this._categoryGeo) {
      this._categoryGeo.drillDown(null, reload);
    }
    
    if (this._categoryCompareGeo) {
      this._categoryCompareGeo.drillDown(null, reload);
    }
  }

}
