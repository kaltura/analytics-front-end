import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AuthService, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { TrendService } from 'shared/services/trend.service';
import { HttpClient } from '@angular/common/http';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { significantDigits } from 'shared/utils/significant-digits';
import { LiveGeoConfig } from './live-geo.config';
import { getCountryName } from 'shared/utils/get-country-name';
import { EChartOption } from 'echarts';
import { canDrillDown } from 'shared/utils/can-drill-down-country';
import { DataTable } from 'primeng/primeng';

@Component({
  selector: 'app-live-geo',
  templateUrl: './live-geo.component.html',
  styleUrls: ['./live-geo.component.scss'],
  providers: [LiveGeoConfig, ReportService]
})
export class LiveGeoComponent implements OnInit, OnDestroy {
  @Input() entryId = '';
  
  @ViewChild('table') _table: DataTable;
  
  private _dataConfig: ReportDataConfig;
  private _mapCenter = [0, 10];
  private _order = '-count_plays';
  private _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _echartsIntance: any; // echart instance
  private _canMapDrillDown = true;
  
  protected _componentId = 'top-videos';
  
  public _mapChartData: any = {};
  public _mapZoom = 1.2;
  public _mapDataReady = false;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = [];
  public _selectedMetrics: string;
  public _reportInterval = KalturaReportInterval.days;
  public _tableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _reportType = KalturaReportType.mapOverlayCountry;
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _drillDown: string[] = [];
  public _mapData: any;
  
  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _trendService: TrendService,
              private _http: HttpClient,
              private _dataConfigService: LiveGeoConfig) {
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
        this._mapData = data;
      });
  }
  
  protected _loadReport(sections = this._dataConfig): void {
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
      .subscribe(report => {
          this._isBusy = false;
          
          if (report.totals) {
            this._tabsData = this._handleTotals(report.totals); // handle totals
          }
          
          if (report.table && report.table.header && report.table.data) {
            this._tableData = this._handleTable(report.table, this._tabsData); // handle table
          }
          
          setTimeout(() => {
            this._updateMap(this._mapCenter);
          }, 0);
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
  
  private _updateMap(mapCenter: number[]): void {
    let mapConfig: EChartOption = this._dataConfigService.getMapConfig(this._drillDown.length > 0 && this._canMapDrillDown);
    mapConfig.series[0].name = this._translate.instant('app.audience.geo.' + this._selectedMetrics);
    mapConfig.series[0].data = [];
    let maxValue = 0;
    this._tableData.forEach(data => {
      const coords = data['coordinates'].split('/');
      let value = [coords[1], coords[0]];
      value.push(parseFloat(data[this._selectedMetrics].replace(new RegExp(',', 'g'), '')));
      mapConfig.series[0].data.push({
        name: this._drillDown.length === 0
          ? getCountryName(data.country, false)
          : this._drillDown.length === 1
            ? data.region
            : data.city,
        value
      });
      if (parseInt(data[this._selectedMetrics]) > maxValue) {
        maxValue = parseInt(data[this._selectedMetrics].replace(new RegExp(',', 'g'), ''));
      }
    });
    
    mapConfig.visualMap.inRange.color = this._tableData.length ? ['#B4E9FF', '#2541B8'] : ['#EBEBEB', '#EBEBEB'];
    mapConfig.visualMap.max = maxValue;
    const map = this._drillDown.length > 0 && this._canMapDrillDown ? mapConfig.geo : mapConfig.visualMap;
    map.center = mapCenter;
    map.zoom = this._mapZoom;
    map.roam = this._drillDown.length === 0 && this._canMapDrillDown ? 'false' : 'move';
    this._mapChartData = mapConfig;
  }
  
  private _setPlaysTrend(row: TableRow, field: string, compareValue: any, currentPeriodTitle: string, comparePeriodTitle: string, units: string = ''): void {
    const currentValue = parseFloat(row[field].replace(/,/g, '')) || 0;
    compareValue = parseFloat(compareValue.toString().replace(/,/g, '')) || 0;
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
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._columns = columns;
    this._columns[0] = this._columns.splice(1, 1, this._columns[0])[0]; // switch places between the first 2 columns
    this._columns.unshift('index'); // add line indexing column at the beginning
    let tmp = this._columns.pop();
    this._columns.push('distribution'); // add distribution column at the end
    this._columns.push(tmp);
    
    return tableData.map((row, index) => {
      const calculateDistribution = (key: string): number => {
        const tab = tabsData.find(item => item.key === key);
        const total = tab ? parseFloat((tab.rawValue as string).replace(new RegExp(',', 'g'), '')) : 0;
        const rowValue = row[key] ? parseFloat((row[key] as string).replace(new RegExp(',', 'g'), '')) : 0;
        return significantDigits((rowValue / total) * 100);
      };
      const playsDistribution = calculateDistribution('count_plays');
      const usersDistribution = calculateDistribution('unique_known_users');
      
      row['plays_distribution'] = ReportHelper.numberWithCommas(playsDistribution);
      row['unique_users_distribution'] = ReportHelper.numberWithCommas(usersDistribution);
      
      return row;
    });
  }
  
  private _handleTotals(totals: KalturaReportTotal): Tab[] {
    return this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
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
  
  public _drillDownTop(reload = true): void {
    this._onDrillDown(null, reload);
  }
  
  public _onChartClick(event): void {
    if (event.data && event.data.name && this._drillDown.length < 2) {
      this._onDrillDown(event.data.name);
    }
  }
  
  public _onDrillDown(country: string, reload = true): void {
    let drillDown = [...this._drillDown];
    if (country === null) {
      drillDown = [];
    } else if (drillDown.length < 2) {
      drillDown.push(getCountryName(country, true));
    } else if (drillDown.length === 2) {
      drillDown.pop();
    }
    
    this._canMapDrillDown = canDrillDown(drillDown[0]);
    
    if (this._table) {
      this._table.reset();
    }
    
    this._mapZoom = drillDown.length === 0 || !this._canMapDrillDown ? 1.2 : this._mapZoom;
    
    this._drillDown = Array.isArray(drillDown) ? drillDown : [drillDown];
    this._reportType = this._drillDown.length === 2 ? KalturaReportType.mapOverlayCity : this._drillDown.length === 1 ? KalturaReportType.mapOverlayRegion : KalturaReportType.mapOverlayCountry;
    
    if (reload) {
      this._loadReport();
    }
  }
  
  public _onChartInit(ec) {
    this._echartsIntance = ec;
  }
  
  public _zoom(direction: string): void {
    if (direction === 'in') {
      this._mapZoom = this._mapZoom * 2;
    } else {
      this._mapZoom = this._mapZoom / 2;
    }
    const roam = this._mapZoom > 1.2 ? 'move' : 'false';
    if (this._drillDown.length > 0 && this._canMapDrillDown) {
      this._echartsIntance.setOption({ geo: [{ zoom: this._mapZoom }] }, false);
      this._echartsIntance.setOption({ geo: [{ roam: roam }] }, false);
    } else {
      this._echartsIntance.setOption({ series: [{ zoom: this._mapZoom }] }, false);
      this._echartsIntance.setOption({ series: [{ roam: roam }] }, false);
    }
  }
}
