import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import {AppAnalytics, ButtonType, ErrorsManagerService, ReportConfig, ReportHelper, ReportService} from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { GeoLocationDataConfig } from './geo-location-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { SelectItem, SortEvent } from 'primeng/api';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import {DateFilterUtils, DateRanges} from 'shared/components/date-filter/date-filter-utils';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { significantDigits } from 'shared/utils/significant-digits';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { getCountryName } from 'shared/utils/get-country-name';
import { Table } from 'primeng/table';
import { canDrillDown } from 'shared/utils/can-drill-down-country';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { reportTypeMap } from 'shared/utils/report-type-map';

export enum GeoTableModes {
  countries = 'countries',
  regions = 'regions',
  cities = 'cities',
}

@Component({
  selector: 'app-ep-geo',
  templateUrl: './geo-location.component.html',
  styleUrls: ['./geo-location.component.scss'],
  providers: [
    GeoLocationDataConfig,
    KalturaLogger.createLogger('EpGeoComponent')
  ]
})
export class EpGeoComponent implements OnInit, OnDestroy {
  @ViewChild('table') _table: Table;
  @Input() entryIdIn = '';
  @Input() set startDate(value: Date) {
    this._startDate = value;
    setTimeout(() => this._loadReport(), 0);
  }
  @Input() endDate: Date;
  @Input() exporting = false;
  @Input() isVirtualClassroom: boolean;

  protected _componentId = 'ep-geo';
  private _startDate: Date;
  private _dataConfig: ReportDataConfig;
  private _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _echartsIntance: any; // echart instance
  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _reportType: KalturaReportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayCountry);
  private _mapCenter = [0, 10];
  private _canMapDrillDown = true;
  private order = '-unique_combined_live_viewers';
  private _mapZoom = 1.2;

  public _currentTableLevel = GeoTableModes.countries;
  public _selectedMetrics: string;
  public _tableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _mapChartData: any = { 'count_plays': {} };
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;
  public _dateFilter: DateChangeEvent = null;
  public _exportConfig: ExportItem[] = [];
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
              private http: HttpClient,
              private _analytics: AppAnalytics,
              private _dataConfigService: GeoLocationDataConfig,
              private _logger: KalturaLogger) {

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
        this._loadReport();
      });
  }

  ngOnDestroy() {
  }

  public _onTableModeChange(mode: GeoTableModes): void {
    this._logger.trace('Handle change table mode action by user', { mode });
    let reportType: KalturaReportType;
    switch (mode) {
      case GeoTableModes.cities:
        reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayCity);
        if (this.isVirtualClassroom) {
          this._analytics.trackButtonClickEvent(ButtonType.Choose, 'VC_session_countries_dropdown', 'cities', 'VC_session_dashboard');
        } else {
          this._analytics.trackButtonClickEvent(ButtonType.Choose, 'Events_session_countries_dropdown', 'cities');
        }
        break;
      case GeoTableModes.regions:
        reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayRegion);
        if (this.isVirtualClassroom) {
          this._analytics.trackButtonClickEvent(ButtonType.Choose, 'VC_session_countries_dropdown', 'regions', 'VC_session_dashboard');
        } else {
          this._analytics.trackButtonClickEvent(ButtonType.Choose, 'Events_session_countries_dropdown', 'regions');
        }
        break;
      case GeoTableModes.countries:
        reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayCountry);
        if (this.isVirtualClassroom) {
          this._analytics.trackButtonClickEvent(ButtonType.Choose, 'VC_session_countries_dropdown', 'countries', 'VC_session_dashboard');
        } else {
          this._analytics.trackButtonClickEvent(ButtonType.Choose, 'Events_session_countries_dropdown', 'countries');
        }
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

    this._loadReport();
  }

  public onPaginationChanges(event): void {
    switch (this._tableMode) {
      case GeoTableModes.countries:
        if (this.isVirtualClassroom) {
          this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'VC_session_countries_paginate', 'countries', 'VC_session_dashboard');
        } else {
          this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'Events_session_countries_paginate', 'countries');
        }
        break;
      case GeoTableModes.regions:
        if (this.isVirtualClassroom) {
          this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'VC_session_countries_paginate', 'regions', 'VC_session_dashboard');
        } else {
          this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'Events_session_countries_paginate', 'regions');
        }
        break;
      case GeoTableModes.cities:
        if (this.isVirtualClassroom) {
          this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'VC_session_countries_paginate', 'cities', 'VC_session_dashboard');
        } else {
          this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'Events_session_countries_paginate', 'cities');
        }
        break;
    }
  }

  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
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
          this._reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayCountry);
        } else if (this._drillDown.length === 0 || goBack) {
          this._currentTableLevel = GeoTableModes.regions;
          this._drillDown = [getCountryName(drillDown, true)];
          this._reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayRegion);
          if (this.isVirtualClassroom) {
            this._analytics.trackButtonClickEvent(ButtonType.Browse, 'VC_session_countries_click_country', null, 'VC_session_dashboard');
          } else {
            this._analytics.trackButtonClickEvent(ButtonType.Browse, 'Events_session_countries_click_country');
          }

        } else if (this._drillDown.length === 1) {
          this._currentTableLevel = GeoTableModes.cities;
          this._drillDown.push(getCountryName(drillDown, true));
          this._reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayCity);
        }
        break;
      case GeoTableModes.regions:
        if (drillDown === '') {
          this._drillDown = [];
          this._currentTableLevel = GeoTableModes.regions;
          this._reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayRegion);
        } else if (this._drillDown.length === 0) {
          this._currentTableLevel = GeoTableModes.cities;
          this._drillDown = [getCountryName(drillDown, true)];
          this._reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayCity);
        }
        break;
      case GeoTableModes.cities:
        this._drillDown = [];
        this._currentTableLevel = GeoTableModes.cities;
        this._reportType = reportTypeMap(KalturaReportType.epWebcastMapOverlayCity);
        break;
    }

    this._mapZoom = !this._isScatter || !this._canMapDrillDown ? 1.2 : this._mapZoom;
    this._pager.pageIndex = 1;

    this._canMapDrillDown = canDrillDown(this._drillDown[0]);

    if (this._table) {
      this._table.reset();
    }

    this._loadReport();
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._setMapCenter();
    this._tableData = [];
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this._startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this.order };
    this._updateReportConfig(reportConfig);
    this._reportService.getReport(reportConfig, sections, false)
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
      let liveViewersDistribution = 0;
      const _totalLiveViewersCount = Number(this._tabsData[0].rawValue);
      if (_totalLiveViewersCount !== 0) {
        const countLiveViewers = parseFloat(row['unique_combined_live_viewers']) || 0;
        liveViewersDistribution = (countLiveViewers / _totalLiveViewersCount) * 100;
      }
      liveViewersDistribution = significantDigits(liveViewersDistribution);
      row['live_viewer_distribution'] = ReportHelper.numberWithCommas(liveViewersDistribution);

      return row;
    });

    setTimeout(() => {
      this._onSortChanged({ data: this._tableData, field: this._selectedMetrics, order: -1 });
    });
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
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
    mapConfig.series[0].name = this._translate.instant('app.entryEp.session.viewers');
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

  private _updateReportConfig(reportConfig: ReportConfig): void {

    if (reportConfig.filter['countryIn']) {
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
        }
        if (this._drillDown.length > 1) {
          reportConfig.filter.regionIn = this._drillDown[1];
        }
        break;
      case GeoTableModes.regions:
        if (this._drillDown.length > 0) {
          reportConfig.filter.regionIn = this._drillDown[0];
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
}
