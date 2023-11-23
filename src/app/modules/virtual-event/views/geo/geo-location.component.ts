import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { GeoLocationDataConfig } from './geo-location-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { SortEvent } from 'primeng/api';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateRanges } from 'shared/components/date-filter/date-filter-utils';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { significantDigits } from 'shared/utils/significant-digits';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { getCountryName } from 'shared/utils/get-country-name';
import { Table } from 'primeng/table';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { VEBaseReportComponent } from "../ve-base-report/ve-base-report.component";
import { BehaviorSubject, forkJoin, of as ObservableOf } from "rxjs";
import { switchMap } from "rxjs/operators";

@Component({
  selector: 'app-ve-geo',
  templateUrl: './geo-location.component.html',
  styleUrls: ['./geo-location.component.scss'],
  providers: [
    GeoLocationDataConfig,
    KalturaLogger.createLogger('VEGeoComponent')
  ]
})
export class VEGeoComponent extends VEBaseReportComponent implements OnInit, OnDestroy {
  @ViewChild('table') _table: Table;
  @Input() virtualEventId = '';
  @Input() exporting = false;
  protected _componentId = 've-geo';
  private _dataConfig: ReportDataConfig;
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _echartsIntance: any; // echart instance
  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _reportType: KalturaReportType = reportTypeMap(KalturaReportType.veRegisteredCountries);
  private _reportTypeWorldRegions: KalturaReportType = reportTypeMap(KalturaReportType.veRegisteredWorldRegions);
  private _mapCenter = [0, 10];
  private order = '-registered_unique_users';
  private _mapZoom = 1.2;

  public topCountries$: BehaviorSubject<{ topCountries: any[], totalCount: number }> = new BehaviorSubject({ topCountries: [], totalCount: 0 });
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  public _dateRange = DateRanges.Last30D;
  public _tableData: TableRow<any>[] = [];
  public _worldRegionsTableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _worldRegionsTabsData: Tab[] = [];
  public _mapChartData: any = { 'count_plays': {} };
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _worldRegionsColumns: string[] = [];
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = [];
  public _exportConfig: ExportItem[] = [];
  public _mapDataReady = false;

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private http: HttpClient,
              private _dataConfigService: GeoLocationDataConfig,
              private _logger: KalturaLogger) {
    super();
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
    this.topCountries$.complete();
  }


  public _onChartInit(ec: any): void {
    this._echartsIntance = ec;
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._table.first = 0;
  }

  protected _updateRefineFilter(): void {
    refineFilterToServerValue(this._refineFilter, this._filter);
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

  public _zoom(direction: string): void {
    this._logger.trace('Handle zoom action by user', { direction });
    this._mapZoom = direction === 'in' ? this._mapZoom * 2 : this._mapZoom / 2;
    const roam = 'move';
    this._echartsIntance.setOption({ series: [{ zoom: this._mapZoom, roam }] }, false);
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._setMapCenter();
    this._tableData = [];
    this._worldRegionsTableData = [];
    this._blockerMessage = null;
    this.topCountries$.next({topCountries: [], totalCount: 0});
    if (this.virtualEventId) {
      this._filter.virtualEventIdIn = this.virtualEventId;
    }
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this.order };
    const worldRegionsReportConfig: ReportConfig = { reportType: this._reportTypeWorldRegions, filter: this._filter, pager: this._pager, order: this.order };
    this._updateReportConfig(reportConfig);
    this._updateReportConfig(worldRegionsReportConfig);

    forkJoin({
      report: this._reportService.getReport(reportConfig, sections, false),
      worldRegionsReport: this._reportService.getReport(worldRegionsReportConfig, sections, false)
    })
      .pipe(cancelOnDestroy(this))
      .pipe(switchMap(({report, worldRegionsReport}) => {
          return ObservableOf({ report, worldRegionsReport});
      }))
      .subscribe(({report, worldRegionsReport}) => {
          if (report.totals && worldRegionsReport.totals) {
            this._handleTotals(report.totals, worldRegionsReport.totals); // handle totals
          }
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle table
            this.topCountries$.next({topCountries: this._tableData, totalCount: report.table.totalCount});
          } else {
            this.topCountries$.next({ topCountries: [], totalCount: 0 });
          }
          if (worldRegionsReport.table && worldRegionsReport.table.header && worldRegionsReport.table.data) {
            this._handleWorldRegionsTable(worldRegionsReport.table); // handle table
          }
          this._updateMap();
          this._table.first = 0;
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
    this._columns = columns;
    this._columns[0] = this._columns.splice(1, 1, this._columns[0])[0]; // switch places between the first 2 columns
    this._columns.unshift('index'); // add line indexing column at the beginning
    let tmp = this._columns.pop();
    this._columns.push('distribution'); // add distribution column at the end
    this._columns.push(tmp);

    // use local total as the unique viewers total is not accurate
    let total = 0;
    for (let i = 0; i < tableData.length; i++) {
      total += parseInt(tableData[i]['registered_unique_users']);
    }
    this._tableData = tableData.map((row, index) => {
      const calculateDistribution = (key: string): number => {
        // const tab = this._tabsData.find(item => item.key === key);
        // const total = tab ? parseFormattedValue(tab.value) : 0;
        const rowValue = parseFormattedValue(row[key]);
        return significantDigits((rowValue / total) * 100);
      };
      const registrationDistribution = calculateDistribution('registered_unique_users');

      row['distribution'] = ReportHelper.numberWithCommas(registrationDistribution);

      return row;
    });

    setTimeout(() => {
      this._onSortChanged({ data: this._tableData, field: this._selectedMetrics, order: -1 });
    });
  }

  private _handleWorldRegionsTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._worldRegionsColumns = columns;
    this._worldRegionsColumns[0] = this._worldRegionsColumns.splice(1, 1, this._worldRegionsColumns[0])[0]; // switch places between the first 2 columns
    this._worldRegionsColumns.unshift('index'); // add line indexing column at the beginning
    let tmp = this._worldRegionsColumns.pop();
    this._worldRegionsColumns.push('distribution'); // add distribution column at the end
    this._worldRegionsColumns.push(tmp);

    // use local total as the unique viewers total is not accurate
    let total = 0;
    for (let i = 0; i < tableData.length; i++) {
      total += parseInt(tableData[i]['registered_unique_users']);
    }
    this._worldRegionsTableData = tableData.map((row, index) => {
      const calculateDistribution = (key: string): number => {
        // const tab = this._worldRegionsTabsData.find(item => item.key === key);
        // const total = tab ? parseFormattedValue(tab.value) : 0;
        const rowValue = parseFormattedValue(row[key]);
        return significantDigits((rowValue / total) * 100);
      };
      const registrationDistribution = calculateDistribution('registered_unique_users');

      row['distribution'] = ReportHelper.numberWithCommas(registrationDistribution);

      return row;
    });

    setTimeout(() => {
      this._onSortChanged({ data: this._worldRegionsTableData, field: this._selectedMetrics, order: -1 });
    });
  }

  private _handleTotals(totals: KalturaReportTotal, worldRegionsReport: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    this._worldRegionsTabsData = this._reportService.parseTotals(worldRegionsReport, this._dataConfig.totals, this._selectedMetrics);
  }

  private _updateMap(): void {
    let mapConfig: EChartOption = this._dataConfigService.getMapConfig();
    (mapConfig.series[0] as any).name = this._translate.instant('app.ve.' + this._selectedMetrics);
    (mapConfig.series[0] as any).data = [];
    let maxValue = 0;

    this._tableData.forEach(data => {
      const coords = data['coordinates'].split('/');
      if (coords.length === 2) {
        let value = [coords[1], coords[0]];
        value.push(parseFormattedValue(data[this._selectedMetrics]));
        (mapConfig.series[0] as any).data.push({name: this._getName(data), value});
        if (parseInt(data[this._selectedMetrics]) > maxValue) {
          maxValue = parseFormattedValue(data[this._selectedMetrics]);
        }
      }
    });

    const map = mapConfig.visualMap as any;
    map.inRange.color = this._tableData.length ? ['#B4E9FF', '#2541B8'] : ['#EBEBEB', '#EBEBEB'];
    map.max = maxValue;
    map.center = this._mapCenter;
    map.zoom = this._mapZoom;
    map.roam = 'move';
    this._mapChartData[this._selectedMetrics] = mapConfig;
  }

  private _getName(data: TableRow): string {
    return getCountryName(data.country, false);
  }

  private _updateReportConfig(reportConfig: ReportConfig): void {
    const countriesFilterApplied = this._refineFilter.find(({ type }) => type === 'countries');

    if (!countriesFilterApplied && reportConfig.filter['countryIn']) {
      delete reportConfig.filter['countryIn'];
    }
    if (reportConfig['objectIds__null']) {
      delete reportConfig['objectIds__null'];
    }
    reportConfig.objectIds = '';

    if (countriesFilterApplied) {
      refineFilterToServerValue(this._refineFilter, reportConfig.filter as KalturaEndUserReportInputFilter);
    }
  }

  private _setMapCenter(): void {
    this._mapCenter = [0, 10];
  }
}
