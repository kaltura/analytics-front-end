import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { GeoLocationDataConfig } from './geo-location-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TrendService } from 'shared/services/trend.service';
import { SelectItem, SortEvent } from 'primeng/api';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateFilterUtils, DateRanges } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { significantDigits } from 'shared/utils/significant-digits';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { getCountryName } from 'shared/utils/get-country-name';
import { Table } from 'primeng/table';
import { canDrillDown } from 'shared/utils/can-drill-down-country';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { GeoExportConfig } from './geo-export.config';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { reportTypeMap } from 'shared/utils/report-type-map';
import {DomainsFilterService} from "shared/components/filter/domains-filter/domains-filter.service";

export enum GeoTableModes {
  countries = 'countries',
  regions = 'regions',
  cities = 'cities',
}

@Component({
  selector: 'app-geo-location',
  templateUrl: './geo-location.component.html',
  styleUrls: ['./geo-location.component.scss'],
  providers: [
    GeoExportConfig,
    GeoLocationDataConfig,
    DomainsFilterService,
    KalturaLogger.createLogger('GeoLocationComponent')
  ]
})
export class GeoLocationComponent implements OnInit, OnDestroy {
  @ViewChild('table') _table: Table;

  public _selectedRefineFilters: RefineFilter = [{
    type: "playbackType",
    value: 'vod'
  }];
  private _dataConfig: ReportDataConfig;
  private _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _selectedTab: Tab;
  private _echartsIntance: any; // echart instance
  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _trendFilter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _reportType: KalturaReportType = reportTypeMap(KalturaReportType.mapOverlayCountry);
  private _mapCenter = [0, 10];
  private _canMapDrillDown = true;
  private order = '-count_plays';
  private _mapZoom = 1.2;

  public _currentTableLevel = GeoTableModes.countries;

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  public _dateRange = DateRanges.Last30D;
  public _tableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _mapChartData: any = { 'count_plays': {} };
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;
  public _refineFilterOpened = false;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = [];
  public _exportConfig: ExportItem[] = [];
  public _geoViewConfig = analyticsConfig.viewsConfig.audience.geo;
  public _drillDown: string[] = [];
  public _mapDataReady = false;
  public _tableMode = GeoTableModes.countries;
  public _tableModes = GeoTableModes;
  public _tableModeOptions: SelectItem[] = [
    { value: GeoTableModes.countries, label: this._translate.instant('app.audience.geo.tableMode.countries') },
    { value: GeoTableModes.regions, label: this._translate.instant('app.audience.geo.tableMode.regions') },
    { value: GeoTableModes.cities, label: this._translate.instant('app.audience.geo.tableMode.cities') },
  ];

  private get _isScatter(): boolean {
    return this._currentTableLevel !== GeoTableModes.countries;
  }

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _trendService: TrendService,
              private http: HttpClient,
              private _dataConfigService: GeoLocationDataConfig,
              private _logger: KalturaLogger,
              private _exportConfigService: GeoExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
    this._isBusy = false;
    // load works map data
    this.http.get('assets/world.json')
      .subscribe(data => {
        this._mapDataReady = true;
        echarts.registerMap('world', data);
      });
  }

  ngOnDestroy() {
  }

  public _onTableModeChange(mode: GeoTableModes): void {
    this._logger.trace('Handle change table mode action by user', { mode });
    let reportType: KalturaReportType;
    switch (mode) {
      case GeoTableModes.cities:
        reportType = reportTypeMap(KalturaReportType.mapOverlayCity);
        break;
      case GeoTableModes.regions:
        reportType = reportTypeMap(KalturaReportType.mapOverlayRegion);
        break;
      case GeoTableModes.countries:
        reportType = reportTypeMap(KalturaReportType.mapOverlayCountry);
        break;
      default:
        reportType = null;
        break;
    }

    this._currentTableLevel = mode;
    this._reportType = reportType;
    this._mapZoom = this._isScatter || !this._canMapDrillDown ? 1.2 : this._mapZoom;
    this._pager.pageIndex = 1;
    this._drillDown = [];

    if (this._table) {
      this._table.reset();
    }

    this._updateExportConfig();

    this._loadReport();
  }

  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
    this._logger.trace('Handle date filter change action by user', { event });
    this._filter.timeZoneOffset = this._trendFilter.timeZoneOffset = event.timeZoneOffset;
    this._filter.fromDate = event.startDate;
    this._filter.toDate = event.endDate;
    this._filter.interval = this._trendFilter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this._pager.pageIndex = 1;
    this._loadReport();
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;

    refineFilterToServerValue(this._refineFilter, this._filter);
    refineFilterToServerValue(this._refineFilter, this._trendFilter);

    this._currentTableLevel = this._tableMode = GeoTableModes.countries;

    if (!this.isVodFilterSelected() && this._selectedTab.key === 'avg_completion_rate') {
      this._onTabChange(this._tabsData[0]);
    }

    this._onDrillDown('');
  }

  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedTab = tab;
    this._selectedMetrics = tab.key;
    this._updateMap();
    this._onSortChanged({ data: this._tableData, field: tab.key, order: -1 });
  }

  public _onSortChanged(event: SortEvent): void {
    if (event.data.length && event.field && event.order) {
      this._logger.trace(
        'Handle sort changed action by user',
        () => ({ order: `${event.order === -1 ? '-' : '+'}${event.field}` })
      );
      event.data.sort((data1, data2) => {
        let value1 = String(parseFormattedValue(data1[event.field]));
        let value2 = String(parseFormattedValue(data2[event.field]));
        const result = value1.localeCompare(value2, undefined, { numeric: true });
        return (event.order * result);
      });
    }
  }

  public _onChartClick(event): void {
    if (event.data && event.data.name && this._currentTableLevel !== GeoTableModes.cities) {
      this._logger.trace('Handle click on chart by user', { country: event.data.name });
      this._onDrillDown(event.data.name);
    }
  }

  public _zoom(direction: string): void {
    this._logger.trace('Handle zoom action by user', { direction });
    this._mapZoom = direction === 'in' ? this._mapZoom * 2 : this._mapZoom / 2;
    const roam = this._mapZoom > 1.2 ? 'move' : 'false';
    if (this._isScatter && this._canMapDrillDown) {
      this._echartsIntance.setOption({ geo: [{ zoom: this._mapZoom, roam }] }, false);
    } else {
      this._echartsIntance.setOption({ series: [{ zoom: this._mapZoom, roam }] }, false);
    }
  }

  public _onDrillDown(drillDown: string, goBack = false): void {
    this._logger.trace('Handle drill down to country action by user', { drillDown });

    switch (this._tableMode) {
      case GeoTableModes.countries:
        if (drillDown === '') {
          this._drillDown = [];
          this._currentTableLevel = GeoTableModes.countries;
          this._reportType = reportTypeMap(KalturaReportType.mapOverlayCountry);
        } else if (this._drillDown.length === 0 || goBack) {
          this._currentTableLevel = GeoTableModes.regions;
          this._drillDown = [getCountryName(drillDown, true)];
          this._reportType = reportTypeMap(KalturaReportType.mapOverlayRegion);
        } else if (this._drillDown.length === 1) {
          this._currentTableLevel = GeoTableModes.cities;
          this._drillDown.push(getCountryName(drillDown, true));
          this._reportType = reportTypeMap(KalturaReportType.mapOverlayCity);
        }
        break;
      case GeoTableModes.regions:
        if (drillDown === '') {
          this._drillDown = [];
          this._currentTableLevel = GeoTableModes.regions;
          this._reportType = reportTypeMap(KalturaReportType.mapOverlayRegion);
        } else if (this._drillDown.length === 0) {
          this._currentTableLevel = GeoTableModes.cities;
          this._drillDown = [getCountryName(drillDown, true)];
          this._reportType = reportTypeMap(KalturaReportType.mapOverlayCity);
        }
        break;
      case GeoTableModes.cities:
        this._drillDown = [];
        this._currentTableLevel = GeoTableModes.cities;
        this._reportType = reportTypeMap(KalturaReportType.mapOverlayCity);
        break;
    }

    this._mapZoom = !this._isScatter || !this._canMapDrillDown ? 1.2 : this._mapZoom;
    this._pager.pageIndex = 1;

    this._canMapDrillDown = canDrillDown(this._drillDown[0]);

    if (this._table) {
      this._table.reset();
    }

    this._updateExportConfig();

    this._loadReport();
  }

  private _updateExportConfig(): void {
    let update: Partial<ExportItem> = { reportType: this._reportType, additionalFilters: {} };

    if (this._drillDown.length > 0) {
      update.additionalFilters.countryIn = this._drillDown[0];
    }

    if (this._drillDown.length > 1) {
      update.additionalFilters.regionIn = this._drillDown[1];
    }

    this._exportConfig = GeoExportConfig.updateConfig(this._exportConfigService.getConfig(), 'geo', update);
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._setMapCenter();
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this.order };
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
        const total = tab ? parseFormattedValue(tab.rawValue) : 0;
        const rowValue = parseFormattedValue(row[key]);
        return significantDigits((rowValue / total) * 100);
      };
      const playsDistribution = calculateDistribution('count_plays');
      const usersDistribution = calculateDistribution('unique_known_users');

      row['plays_distribution'] = ReportHelper.numberWithCommas(playsDistribution);
      row['unique_users_distribution'] = ReportHelper.numberWithCommas(usersDistribution);

      return row;
    });

    setTimeout(() => {
      this._onSortChanged({ data: this._tableData, field: this._selectedMetrics, order: -1 });
    });
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    this._selectedTab = this._tabsData[0];
  }

  private _getName(data: TableRow): string {
    switch (this._currentTableLevel) {
      case GeoTableModes.countries:
        return getCountryName(data.country, false);
      case GeoTableModes.regions:
        return data.region;
      case GeoTableModes.cities:
        return data.city;
      default:
        return null;
    }
  }

  private _updateMap(): void {
    const isScatter = this._canMapDrillDown && this._isScatter;
    let mapConfig: EChartOption = this._dataConfigService.getMapConfig(isScatter);
    mapConfig.series[0].name = this._translate.instant('app.audience.geo.' + this._selectedMetrics);
    mapConfig.series[0].data = [];
    let maxValue = 0;

    this._tableData.forEach(data => {
      const coords = data['coordinates'].split('/');
      if (coords.length === 2) {
        let value = [coords[1], coords[0]];
        value.push(parseFormattedValue(data[this._selectedMetrics]));
        mapConfig.series[0].data.push({name: this._getName(data), value});
        if (parseInt(data[this._selectedMetrics]) > maxValue) {
          maxValue = parseFormattedValue(data[this._selectedMetrics]);
        }
      }
    });

    mapConfig.visualMap.inRange.color = this._tableData.length ? ['#B4E9FF', '#2541B8'] : ['#EBEBEB', '#EBEBEB'];
    mapConfig.visualMap.max = maxValue;
    const map = this._drillDown.length > 0 && this._canMapDrillDown ? mapConfig.geo : mapConfig.visualMap;
    map.center = this._mapCenter;
    map.zoom = this._mapZoom;
    map.roam = !this._isScatter || this._canMapDrillDown ? 'false' : 'move';
    this._mapChartData[this._selectedMetrics] = mapConfig;
  }

  private _loadTrendData(): void {
    const { startDate, endDate } = this._trendService.getCompareDates(this._filter.fromDate, this._filter.toDate);
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(this._filter.fromDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._filter.toDate, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(startDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(endDate, analyticsConfig.locale)}`;

    this._trendFilter.fromDate = startDate;
    this._trendFilter.toDate = endDate;

    const reportConfig: ReportConfig = {
      reportType: this._reportType,
      filter: this._trendFilter,
      pager: this._pager,
      order: this.order
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
            let compareValue = relevantCompareRow ? relevantCompareRow['count_plays'] : 0;
            this._setPlaysTrend(row, 'count_plays', compareValue, currentPeriodTitle, comparePeriodTitle);
            compareValue = relevantCompareRow ? relevantCompareRow['unique_known_users'] : 0;
            this._setPlaysTrend(row, 'unique_known_users', compareValue, currentPeriodTitle, comparePeriodTitle);
            compareValue = relevantCompareRow ? relevantCompareRow['avg_completion_rate'] : 0;
            this._setPlaysTrend(row, 'avg_completion_rate', compareValue, currentPeriodTitle, comparePeriodTitle, '%');
          });
        } else {
          this._tableData.forEach(row => {
            this._setPlaysTrend(row, 'count_plays', 0, currentPeriodTitle, comparePeriodTitle);
            this._setPlaysTrend(row, 'unique_known_users', 0, currentPeriodTitle, comparePeriodTitle);
            this._setPlaysTrend(row, 'avg_completion_rate', 0, currentPeriodTitle, comparePeriodTitle, '%');
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
            row['count_avg_completion_rate'] = { trend: 'N/A' };
          });
        }
      });
  }

  private _setPlaysTrend(row: any, field: string, compareValue: any, currentPeriodTitle: string, comparePeriodTitle: string, units: string = ''): void {
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

    switch (this._tableMode) {
      case GeoTableModes.countries:
        if (this._drillDown.length > 0) {
          reportConfig.filter.countryIn = this._drillDown[0];
        } else if (countriesFilterApplied) {
          refineFilterToServerValue(this._refineFilter, reportConfig.filter as KalturaEndUserReportInputFilter);
        }
        if (this._drillDown.length > 1) {
          reportConfig.filter.regionIn = this._drillDown[1];
        }
        break;
      case GeoTableModes.regions:
        if (this._drillDown.length > 0) {
          reportConfig.filter.regionIn = this._drillDown[0];
        } else if (countriesFilterApplied) {
          refineFilterToServerValue(this._refineFilter, reportConfig.filter as KalturaEndUserReportInputFilter);
        }
        break;
      case GeoTableModes.cities:
        if (countriesFilterApplied) {
          refineFilterToServerValue(this._refineFilter, reportConfig.filter as KalturaEndUserReportInputFilter);
        }
        break;
    }
  }

  private _setMapCenter(): void {
    this._mapCenter = [0, 10];
    if (this._isScatter && this._canMapDrillDown) {
      const location = this._isScatter && this._tableMode === GeoTableModes.countries ? this._drillDown[0] : this._drillDown[1];
      let found = false;
      this._tableData.forEach(data => {
        if (this._tableMode === GeoTableModes.countries) {
          if (data.country && data.country === location) {
            found = true;
            this._mapCenter = [data['coordinates'].split('/')[1], data['coordinates'].split('/')[0]];
          }
        } else {
          if (data.region && data.region === location) {
            found = true;
            this._mapCenter = [data['coordinates'].split('/')[1], data['coordinates'].split('/')[0]];
          }
        }
      });
      if (!found && this._tableData.length) {
        this._mapCenter = [this._tableData[0]['coordinates'].split('/')[1], this._tableData[0]['coordinates'].split('/')[0]];
      }
    }
  }

  private isVodFilterSelected() {
    const playbackTypeFilters = this._refineFilter.filter(filter => filter.type === 'playbackType');
    return playbackTypeFilters.length === 0 || playbackTypeFilters.find(filter => filter.value === 'vod');
  }

  getTabsData() {
    return this.isVodFilterSelected() ? this._tabsData : this._tabsData.filter(tab => tab.key !== 'avg_completion_rate');
  }
}
