import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { TopCountriesConfig } from './top-countries.config';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { EntryBase } from '../entry-base/entry-base';
import { tableLocalSortHandler, TableRow } from 'shared/utils/table-local-sort-handler';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { TrendService } from 'shared/services/trend.service';
import { HttpClient } from '@angular/common/http';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { analyticsConfig } from 'configuration/analytics-config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { significantDigits } from 'shared/utils/significant-digits';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { getCountryName } from 'shared/utils/get-country-name';

@Component({
  selector: 'app-top-countries',
  templateUrl: './top-countries.component.html',
  styleUrls: ['./top-countries.component.scss'],
  providers: [TopCountriesConfig, ReportService]
})
export class TopCountriesComponent extends EntryBase implements OnInit, OnDestroy {
  @Input() entryId = '';
  
  private _dataConfig: ReportDataConfig;
  private _mapCenter = [0, 10];
  private _order = '-count_plays';
  private _echartsIntance: any; // echart instance
  private _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _trendFilter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  
  protected _componentId = 'top-videos';
  
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = [];
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  public _dateRange = DateRanges.Last30D;
  public _tableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _mapChartData: any = { 'count_plays': {} };
  public _isBusy: boolean;
  public _csvExportHeaders = '';
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;
  public _reportType: KalturaReportType = KalturaReportType.mapOverlayCountry;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _drillDown: string[] = [];
  public _mapZoom = 1.2;
  public _mapDataReady = false;
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _trendService: TrendService,
              private _http: HttpClient,
              private _dataConfigService: TopCountriesConfig,
              private _logger: KalturaLogger) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  ngOnDestroy() {
  }
  
  ngOnInit() {
    this._isBusy = false;
    // load works map data
    this._http.get('assets/world.json')
      .subscribe(data => {
        this._mapDataReady = true;
        echarts.registerMap('world', data);
      });
  }
  
  protected _updateRefineFilter(): void {
    this._onDrillDown('', false);

    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _updateFilter(): void {
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
    console.warn('aaaa');
    this._isBusy = true;
    this._setMapCenter();
    this._tableData = [];
    this._blockerMessage = null;
    
    if (this.entryId) {
      this._filter.entryIdIn = this.entryId;
    }
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    this._updateReportConfig(reportConfig);
    this._reportService.getReport(reportConfig, sections)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle table
          }
          this._updateMap();
          this._isBusy = false;
          this._loadTrendData();
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
  
  private _loadTrendData(): void {
    const { startDate, endDate } = this._trendService.getCompareDates(this._filter.fromDate, this._filter.toDate);
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(this._filter.fromDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._filter.toDate, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(startDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(endDate, analyticsConfig.locale)}`;
  
    if (this.entryId) {
      this._trendFilter.entryIdIn = this.entryId;
    }
    this._trendFilter.fromDate = startDate;
    this._trendFilter.toDate = endDate;
    
    const reportConfig: ReportConfig = {
      reportType: this._reportType,
      filter: this._trendFilter,
      pager: this._pager,
      order: this._order
    };
    this._updateReportConfig(reportConfig);
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
        if (report.table && report.table.header && report.table.data) {
          const { tableData } = this._reportService.parseTableData(report.table, this._dataConfig.table);
          this._tableData.forEach(row => {
            const relevantCompareRow = tableData.find(item => {
              const sameCountry = item.country === row.country;
              const sameRegion = item.region === row.region;
              const sameCity = item.city === row.city;
              
              return sameCountry && sameRegion && sameCity;
            });
            const compareValue = relevantCompareRow ? relevantCompareRow['count_plays'] : 0;
            this._setPlaysTrend(row, 'count_plays', compareValue, currentPeriodTitle, comparePeriodTitle);
          });
        } else {
          this._tableData.forEach(row => {
            this._setPlaysTrend(row, 'count_plays', 0, currentPeriodTitle, comparePeriodTitle);
          });
        }
      }, error => {
        const err: ErrorDetails = this._errorsManager.getError(error);
        if (err.forceLogout) {
          this._blockerMessage = new AreaBlockerMessage({
            title: err.title,
            message: err.message,
            buttons: [{
              label: this._translate.instant('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
                this._authService.logout();
              }
            }]
          });
        } else {
          this._tableData.forEach(row => {
            row['count_plays_trend'] = { trend: 'N/A' };
            row['count_unique_known_users'] = { trend: 'N/A' };
            row['count_avg_view_drop_off'] = { trend: 'N/A' };
          });
        }
      });
  }
  
  private _setPlaysTrend(row: any, field: string, compareValue: any, currentPeriodTitle: string, comparePeriodTitle: string, units: string = ''): void {
    const currentValue = parseFloat(row[field].replace(/,/g, '')) || 0;
    compareValue = parseFloat(compareValue.toString().replace(/,/g, '')) || 0;
    const { value, direction } = this._trendService.calculateTrend(currentValue, compareValue);
    const tooltip = `
      ${this._trendService.getTooltipRowString(currentPeriodTitle, ReportHelper.numberWithCommas(currentValue), units)}
      ${this._trendService.getTooltipRowString(comparePeriodTitle, ReportHelper.numberWithCommas(compareValue), units)}
    `;
    row[field + '_trend'] = {
      trend: value !== null ? value : '–',
      trendDirection: direction,
      tooltip: tooltip,
      units: value !== null ? '%' : '',
    };
  }
  
  
  public _onSortChanged(event) {
    tableLocalSortHandler(event, this._order, this._isCompareMode);
  }
  
  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._columns[0] = this._columns.splice(1, 1, this._columns[0])[0]; // switch places between the first 2 columns
    this._columns.unshift('index'); // add line indexing column at the beginning
    let tmp = this._columns.pop();
    this._columns.push('distribution'); // add distribution column at the end
    this._columns.push(tmp);
    
    this._tableData = tableData.map((row, index) => {
      const calculateDistribution = (key: string): number => {
        const tab = this._tabsData.find(item => item.key === key);
        const total = tab ? parseFloat(tab.rawValue as string) : 0;
        const rowValue = parseFloat(row[key]) || 0;
        return significantDigits((rowValue / total) * 100);
      };
      const playsDistribution = calculateDistribution('count_plays');
      const usersDistribution = calculateDistribution('unique_known_users');
      
      row['plays_distribution'] = ReportHelper.numberWithCommas(playsDistribution);
      row['unique_users_distribution'] = ReportHelper.numberWithCommas(usersDistribution);
      
      return row;
    });
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }
  
  private _updateMap(): void {
    let mapConfig: EChartOption = this._dataConfigService.getMapConfig(this._drillDown.length > 0);
    mapConfig.series[0].name = this._translate.instant('app.audience.geo.' + this._selectedMetrics);
    mapConfig.series[0].data = [];
    let maxValue = 0;
    
    console.warn(this._tableData);

    this._tableData.forEach(data => {
      const coords = data['coordinates'].split('/');
      let value = [coords[1], coords[0]];
      value.push(parseFloat(data[this._selectedMetrics].replace(new RegExp(analyticsConfig.valueSeparator, 'g'), '')));
      mapConfig.series[0].data.push({
        name: this._drillDown.length === 0
          ? getCountryName(data.country, false)
          : this._drillDown.length === 1
            ? data.region
            : data.city,
        value
      });
      if (parseInt(data[this._selectedMetrics]) > maxValue) {
        maxValue = parseInt(data[this._selectedMetrics].replace(new RegExp(analyticsConfig.valueSeparator, 'g'), ''));
      }
    });
    
    mapConfig.visualMap.max = maxValue;
    const map = this._drillDown.length > 0 ? mapConfig.geo : mapConfig.visualMap;
    map.center = this._mapCenter;
    map.zoom = this._mapZoom;
    map.roam = this._drillDown.length === 0 ? 'false' : 'move';
    this._mapChartData[this._selectedMetrics] = mapConfig;
  }
  
  private _updateReportConfig(reportConfig: ReportConfig): void {
    const countriesFilterApplied = this._refineFilter.find(({ type }) => type === 'countries');
    
    if (!countriesFilterApplied && reportConfig.filter['countryIn']) {
      delete reportConfig.filter['countryIn'];
    }
    if (reportConfig.filter['regionIn']) {
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
  
  public _onChartInit(ec) {
    this._echartsIntance = ec;
  }
  
  public _zoom(direction: string): void {
    this._logger.trace('Handle zoom action by user', { direction });
    if (direction === 'in') {
      this._mapZoom = this._mapZoom * 2;
    } else {
      this._mapZoom = this._mapZoom / 2;
    }
    const roam = this._mapZoom > 1.2 ? 'move' : 'false';
    if (this._drillDown.length > 0) {
      this._echartsIntance.setOption({ geo: [{ zoom: this._mapZoom }] }, false);
      this._echartsIntance.setOption({ geo: [{ roam: roam }] }, false);
    } else {
      this._echartsIntance.setOption({ series: [{ zoom: this._mapZoom }] }, false);
      this._echartsIntance.setOption({ series: [{ roam: roam }] }, false);
    }
  }
  
  public _onDrillDown(country: string, loadReport = true): void {
    this._logger.trace('Handle drill down to country action by user', { country });
    if (country === '') {
      this._drillDown = [];
    } else if (this._drillDown.length < 2) {
      this._drillDown.push(getCountryName(country, true));
    } else if (this._drillDown.length === 2) {
      this._drillDown.pop();
    }
    this._reportType = this._drillDown.length === 2 ? KalturaReportType.mapOverlayCity : this._drillDown.length === 1 ? KalturaReportType.mapOverlayRegion : KalturaReportType.mapOverlayCountry;
    this._mapZoom = this._drillDown.length === 0 ? 1.2 : this._mapZoom;
    this._pager.pageIndex = 1;
    
    if (loadReport) {
      this._loadReport();
    }
  }
  
  public _onChartClick(event): void {
    this._logger.trace('Handle click on chart by user', { country: event.data.name });
    if (event.data && event.data.name && this._drillDown.length < 2) {
      this._onDrillDown(event.data.name);
    }
  }
}
