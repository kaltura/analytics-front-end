import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import {DateChangeEvent, DateRanges, DateRangeType} from 'shared/components/date-filter/date-filter.service';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaFilterPager, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { GeoLocationDataConfig } from './geo-location-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TrendService } from 'shared/services/trend.service';
import { SelectItem } from 'primeng/api';
import { EChartOption } from 'echarts';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import * as echarts from 'echarts';

@Component({
  selector: 'app-geo-location',
  templateUrl: './geo-location.component.html',
  styleUrls: ['./geo-location.component.scss'],
  providers: [GeoLocationDataConfig]
})
export class GeoLocationComponent implements OnInit, OnDestroy {
  private _dataConfig: ReportDataConfig;

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  public _dateRange = DateRanges.Last30D;

  public _tableData: any[] = [];
  private unFilteredTableData: any[] = [];
  private selectedTab: Tab;
  public _tabsData: Tab[] = [];
  public _mapChartData: any = {'count_plays': {}};

  public _isBusy: boolean;
  public _csvExportHeaders = '';
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;
  public _tags: any[] = [];

  private pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});
  public reportType: KalturaReportType = KalturaReportType.mapOverlayCountry;
  public filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private trendFilter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  public _countryCodes: { value: string, label: string }[] = [];
  public _selectedCountries: SelectItem[] = [];
  public _drillDown: string[] = [];
  private mapCenter = [0, 10];

  private order = '-count_plays';
  private echartsIntance: any; // echart instance
  public _mapZoom = 1.2;

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _trendService: TrendService,
              private http: HttpClient,
              private _dataConfigService: GeoLocationDataConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
    this._isBusy = false;
    // load works map data
    this.http.get('assets/world.json')
      .subscribe(data => {
        echarts.registerMap('world', data);
      });
  }

  public onChartInit(ec) {
    this.echartsIntance = ec;
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this.filter.timeZoneOffset = this.trendFilter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDay = event.startDay;
    this.filter.toDay = event.endDay;
    this.filter.interval = this.trendFilter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this.pager.pageIndex = 1;
    this.loadReport();
  }

  public _onTabChange(tab: Tab): void {
    this.selectedTab = tab;
    this._selectedMetrics = tab.key;
    this.updateMap();
    this._onSortChanged({data: this._tableData, field: tab.key, order: -1});
  }

  public _onSortChanged(event) {
    if (event.data.length && event.field && event.order) {
      event.data.sort((data1, data2) => {
        let value1 = parseInt(data1[event.field].replace(new RegExp(analyticsConfig.valueSeparator, 'g'), ''));
        let value2 = parseInt(data2[event.field].replace(new RegExp(analyticsConfig.valueSeparator, 'g'), ''));
        let result = null;

        if (value1 < value2) {
          result = -1;
        } else if (value1 > value2) {
          result = 1;
        } else if (value1 === value2) {
          result = 0;
        }
        return (event.order * result);
      });
    }
  }

  public getValue(val: string): number {
    return parseFloat(val.split(analyticsConfig.valueSeparator).join(''));
  }

  public getPercent(val: string): number {
    const total: number = parseFloat(this.selectedTab.value.split(analyticsConfig.valueSeparator).join(''));
    return parseFloat(val.split(analyticsConfig.valueSeparator).join('')) / total * 100;
  }

  public onChartClick(event): void {
    if (event.data && event.data.name && this._drillDown.length < 2) {
      this._onDrillDown(event.data.name);
    }
  }

  public zoom(direction: string): void {
    if (direction === 'in') {
      this._mapZoom = this._mapZoom * 2;
    } else {
      this._mapZoom = this._mapZoom / 2;
    }
    const roam = this._mapZoom > 1.2 ? 'move' : 'false';
    if (this._drillDown.length > 0) {
      this.echartsIntance.setOption({geo: [{zoom: this._mapZoom}]}, false);
      this.echartsIntance.setOption({geo: [{roam: roam}]}, false);
    } else {
      this.echartsIntance.setOption({series: [{zoom: this._mapZoom}]}, false);
      this.echartsIntance.setOption({series: [{roam: roam}]}, false);
    }
  }

  public _onCountrySelectChange(event): void {
    this.updateSelectedCountries();
  }

  public _onRemoveTag(country: any): void {
    const index = this._selectedCountries.indexOf(country.data);
    if (index > -1) {
      this._selectedCountries.splice(index, 1);
      this.updateSelectedCountries();
    }
  }

  public _onRemoveAllTags(): void {
    this._tags = [];
    this._selectedCountries = [];
    this.updateSelectedCountries();
  }

  public _onDrillDown(country: string): void {
    if (country === '') {
      this._drillDown = [];
    } else if (this._drillDown.length < 2) {
      this._drillDown.push(country);
    } else if (this._drillDown.length === 2) {
      this._drillDown.pop();
    }
    this.reportType = this._drillDown.length === 2 ?  KalturaReportType.mapOverlayCity : this._drillDown.length === 1 ? KalturaReportType.mapOverlayRegion : KalturaReportType.mapOverlayCountry;
    this._mapZoom = this._drillDown.length === 0 ? 1.2 : this._mapZoom;
    this.pager.pageIndex = 1;
    this.loadReport();
  }

  private loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this.setMapCenter();
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this.updateReportConfig(reportConfig);
    this._reportService.getReport(reportConfig, sections)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          this._countryCodes = [];
          if (report.totals) {
            this.handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.header && report.table.data) {
            this.handleTable(report.table); // handle table
          }
          this.updateMap();
          this.prepareCsvExportHeaders();
          this._isBusy = false;
          this._loadTrendData();
        },
        error => {
          this._isBusy = false;
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if ( err.forceLogout ) {
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
                  this.loadReport();
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

  private handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._columns[0] = this._columns.splice(1, 1, this._columns[0])[0]; // switch places between the first 2 columns
    this._columns.unshift('index'); // add line indexing column at the beginning
    let tmp = this._columns.pop();
    this._columns.push('distribution'); // add distribution column at the end
    this._columns.push(tmp);
    this._tableData = tableData;

    // set countries filter data
    if (this._drillDown.length === 0) {
      this.unFilteredTableData = [];
      tableData.forEach(data => {
        this._countryCodes.push({label: data.country, value: data.object_id.toLowerCase()});
        this.unFilteredTableData.push(data);
      });
      this.updateSelectedCountries();
    }
  }

  private updateSelectedCountries(): void {
    this._tags = [];
    this._tableData = this.unFilteredTableData.filter(data => {
      if (this._selectedCountries.length === 0) {
        return true;
      } else {
        let found = false;
        this._selectedCountries.forEach(country => {
          if (data.object_id.toLowerCase() === country) {
            this._tags.push({country: data.country, data: country});
            found = true;
          }
        });
        return found;
      }
    });
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    this.selectedTab = this._tabsData[0];
  }

  private prepareCsvExportHeaders(): void {
    this._csvExportHeaders = this._dataConfigService.prepareCsvExportHeaders(this._tabsData, this._columns, 'app.audience.geo');
  }

  private updateMap(): void {
    let mapConfig: EChartOption = this._dataConfigService.getMapConfig(this._drillDown.length > 0);
    mapConfig.series[0].name = this._translate.instant('app.audience.geo.' + this._selectedMetrics);
    mapConfig.series[0].data = [];
    let maxValue = 0;

    this._tableData.forEach(data => {
      const coords = data['coordinates'].split('/');
      let value = [coords[1], coords[0]];
      value.push(parseFloat(data[this._selectedMetrics].replace(new RegExp(analyticsConfig.valueSeparator, 'g'), '')));
      mapConfig.series[0].data.push({
        name: this._drillDown.length === 0 ? data.country : this._drillDown.length === 1 ? data.region : data.city,
        value
      });
      if (parseInt(data[this._selectedMetrics]) > maxValue) {
        maxValue = parseInt(data[this._selectedMetrics].replace(new RegExp(analyticsConfig.valueSeparator, 'g'), ''));
      }
    });

    mapConfig.visualMap.max = maxValue;
    const map = this._drillDown.length > 0 ? mapConfig.geo : mapConfig.visualMap;
    map.center = this.mapCenter;
    map.zoom = this._mapZoom;
    map.roam = this._drillDown.length === 0 ? 'false' : 'move';
    this._mapChartData[this._selectedMetrics] = mapConfig;
  }

  private _loadTrendData(): void {
    const { startDay, endDay } = this._trendService.getCompareDates(this.filter.fromDay, this.filter.toDay);
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(this.filter.fromDay, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this.filter.toDay, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(startDay, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(endDay, analyticsConfig.locale)}`;

    this.trendFilter.fromDay = startDay;
    this.trendFilter.toDay = endDay;

    const reportConfig: ReportConfig = {
      reportType: this.reportType,
      filter: this.trendFilter,
      pager: this.pager,
      order: this.order
    };
    this.updateReportConfig(reportConfig);
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
        if (report.table && report.table.header && report.table.data) {
          const { tableData } = this._reportService.parseTableData(report.table, this._dataConfig.table);
          this._tableData.forEach(row => {
            const relevantCompareRow = tableData.find(item => item.object_id === row.object_id);
            let compareValue = relevantCompareRow ? relevantCompareRow['count_plays'] : 0;
            this._setPlaysTrend(row, 'count_plays', compareValue, currentPeriodTitle, comparePeriodTitle);
            compareValue = relevantCompareRow ? relevantCompareRow['unique_known_users'] : 0;
            this._setPlaysTrend(row, 'unique_known_users', compareValue, currentPeriodTitle, comparePeriodTitle);
            compareValue = relevantCompareRow ? relevantCompareRow['avg_view_drop_off'] : 0;
            this._setPlaysTrend(row, 'avg_view_drop_off', compareValue, currentPeriodTitle, comparePeriodTitle, '%');
          });
        } else {
          this._tableData.forEach(row => {
            this._setPlaysTrend(row, 'count_plays', 0, currentPeriodTitle, comparePeriodTitle);
            this._setPlaysTrend(row, 'unique_known_users', 0, currentPeriodTitle, comparePeriodTitle);
            this._setPlaysTrend(row, 'avg_view_drop_off', 0, currentPeriodTitle, comparePeriodTitle, '%');
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

  private updateReportConfig(reportConfig: ReportConfig): void {
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

    if (this._drillDown.length > 0) {
      reportConfig.filter.countryIn = this._drillDown[0];
    }

    if (this._drillDown.length > 1) {
      reportConfig.filter.regionIn = this._drillDown[1];
    }
  }

  private setMapCenter(): void {
    this.mapCenter = [0, 10];
    if (this._drillDown.length > 0 ) {
      const location = this._drillDown.length === 1 ? this._drillDown[0] : this._drillDown[1];
      let found = false;
      this._tableData.forEach(data => {
        const name = this._drillDown.length === 1 ? data.country : data.region;
        if (location === name ) {
          found = true;
          this.mapCenter = [data['coordinates'].split('/')[1], data['coordinates'].split('/')[0]];
        }
      });
      if (!found && this._tableData.length) {
        this.mapCenter = [this._tableData[0]["coordinates"].split('/')[1], this._tableData[0]["coordinates"].split('/')[0]];
      }
    }
  }

  ngOnDestroy() {}
}
