import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DevicesOverviewConfig } from './devices-overview.config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TrendService } from 'shared/services/trend.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

export interface SummaryItem {
  key: string;
  name: string;
  value: number;
  rawValue: number;
  units: string;
  compareUnits: string;
}

export interface Summary {
  [key: string]: SummaryItem[];
}

@Component({
  selector: 'app-devices-overview',
  templateUrl: './devices-overview.component.html',
  styleUrls: ['./devices-overview.component.scss'],
  providers: [
    KalturaLogger.createLogger('DevicesOverviewComponent'),
    DevicesOverviewConfig,
    ReportService,
  ]
})
export class DevicesOverviewComponent implements OnDestroy {
  @Input() allowedDevices: string[] = [];
  
  @Input() set filter(value: DateChangeEvent) {
    if (value) {
      this._chartDataLoaded = false;
      this._filter.timeZoneOffset = value.timeZoneOffset;
      this._filter.fromDay = value.startDay;
      this._filter.toDay = value.endDay;
      this._filter.interval = value.timeUnits;
      this._reportInterval = value.timeUnits;
      this._pager.pageIndex = 1;
      this.loadReport();
      this.resetDeviceFilters(true, false);
    }
  }
  
  @Output() metricChanged = new EventEmitter<string>();
  @Output() deviceFilterChange = new EventEmitter<string[]>();
  @Output() devicesListChange = new EventEmitter<{ value: string, label: string; }[]>();
  @Output() exportDataChange = new EventEmitter<{
    headers: string,
    totalCount: number,
    filter: KalturaEndUserReportInputFilter,
    selectedMetrics: string
  }>();
  
  private _fractions = 1;
  private _columns: string[] = [];
  private _devicesDataLoaded = new BehaviorSubject<boolean>(false);
  
  public _selectedValues = [];
  public _blockerMessage: AreaBlockerMessage = null;
  public _selectedMetrics: string;
  public _barChartData: { [key: string]: any; } = {};
  public _rawChartData: { [key: string]: { value: number, key: string; }[]; } = {};
  public _mergeChartData: { [key: string]: any; } = {};
  public _summaryData: Summary = {};
  public _isBusy = false;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tabsData: Tab[] = [];
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _dataConfig: ReportDataConfig;
  public _filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  
  constructor(private _reportService: ReportService,
              private _trendService: TrendService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _errorsManager: ErrorsManagerService,
              private _platformsConfigService: DevicesOverviewConfig,
              private _logger: KalturaLogger) {
    this._dataConfig = _platformsConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
    this.metricChanged.emit(this._selectedMetrics);
  }
  
  ngOnDestroy() {
    this._devicesDataLoaded.complete();
  }
  
  private loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = {
      reportType: KalturaReportType.platforms,
      filter: this._filter,
      pager: this._pager,
      order: null
    };
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
          this._tabsData = [];
          this._columns = [];
          this._barChartData = {};
          this._rawChartData = {};
          this._summaryData = {};
        
          // IMPORTANT to handle totals first, summary rely on totals
          if (report.totals) {
            this.handleTotals(report.totals); // handle totals
          }
        
          if (report.table && report.table.header && report.table.data) {
            this.handleOverview(report.table); // handle overview
          }
        
          this._isBusy = false;
    
          this._devicesDataLoaded.next(true);
        
          this.exportDataChange.emit({
            headers: this._platformsConfigService.prepareCsvExportHeaders(this._tabsData, this._columns, 'app.audience.technology'),
            totalCount: report.table.totalCount,
            selectedMetrics: this._selectedMetrics,
            filter: this._filter,
          });
        },
        error => {
          this._isBusy = false;
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if (err.forceLogout) {
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
  
    this._loadTrendData();
  }
  
  private _setCompareData(device: SummaryItem, compareValue: number, currentPeriodTitle: string, comparePeriodTitle: string): void {
    const currentValue = device.rawValue;
    const { value, direction } = this._trendService.calculateTrend(currentValue, compareValue);
    const tooltip = `${this._trendService.getTooltipRowString(currentPeriodTitle, ReportHelper.numberWithCommas(currentValue.toFixed(this._fractions)))}${this._trendService.getTooltipRowString(comparePeriodTitle, ReportHelper.numberWithCommas(compareValue.toFixed(this._fractions)))}`;
    device['trend'] = value !== null ? value : '–';
    device['trendDirection'] = direction;
    device['tooltip'] = tooltip;
    device['compareUnits'] = value !== null ? '%' : '';
  }
  
  private _loadTrendData(): void {
    const { startDay, endDay } = this._trendService.getCompareDates(this._filter.fromDay, this._filter.toDay);
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(this._filter.fromDay, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._filter.toDay, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(startDay, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(endDay, analyticsConfig.locale)}`;
  
    const compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
    compareFilter.fromDay = startDay;
    compareFilter.toDay = endDay;

    const reportConfig: ReportConfig = {
      reportType: KalturaReportType.platforms,
      filter: compareFilter,
      pager: this._pager,
      order: null
    };
    
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
          const waitForDevicesData = this._devicesDataLoaded // make sure main data has loaded
            .asObservable()
            .pipe(filter(Boolean))
            .subscribe(() => {
              this._devicesDataLoaded.next(false);
              if (waitForDevicesData) {
                waitForDevicesData.unsubscribe();
              }
  
              if (report.table && report.table.header && report.table.data) {
                const relevantFields = Object.keys(this._dataConfig.totals.fields);
                const { data } = this._getOverviewData(report.table, relevantFields);
                const compareData = this._getSummaryData(data, relevantFields);
                Object.keys(this._summaryData).forEach(key => {
                  const compare = compareData[key] as SummaryItem[];
                  if (compare) {
                    this._summaryData[key].forEach((device, index) => {
                      const relevantCompareItem = compare.find(item => item.key === device.key);
                      const rawValue = relevantCompareItem ? relevantCompareItem.rawValue : 0;
                      this._setCompareData(device, rawValue, currentPeriodTitle, comparePeriodTitle);
                    });
                  }
                });
              } else {
                Object.keys(this._summaryData).forEach(key => {
                  this._summaryData[key].forEach((device) => {
                    this._setCompareData(device, 0, currentPeriodTitle, comparePeriodTitle);
                  });
                });
              }
            });
        },
        error => {
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
            Object.keys(this._summaryData).forEach(key => {
              this._summaryData[key].forEach((device) => {
                device['trend'] = 'N/A';
              });
            });
          }
        });
  }
  
  private _getOverviewData(table: KalturaReportTable, relevantFields: string[]): { data: { [key: string]: string }[], columns: string[] } {
    const { tableData, columns } = this._reportService.parseTableData(table, this._dataConfig.table);
    const data = tableData.reduce((data, item) => {
      if (this.allowedDevices.indexOf(item.device) > -1) {
        data.push(item);
      } else {
        const otherIndex = data.findIndex(({ device }) => device === 'OTHER');
        if (otherIndex !== -1) {
          relevantFields.forEach(key => {
            data[otherIndex][key] = (parseFloat(data[otherIndex][key]) || 0) + (parseFloat(item[key]) || 0);
          });
        } else {
          item.device = 'OTHER';
          data.push(item);
        }
      }
      return data;
    }, []);
    
    // move other devices in the end
    const otherDevicesIndex = data.findIndex(({ device }) => device === 'OTHER');
    if (otherDevicesIndex !== -1) {
      data.push(data.splice(otherDevicesIndex, 1)[0]);
    }
    
    return { data, columns };
  }
  
  private _handleDevicesListChange(data: { [key: string]: string }[]): void {
    const devices = data.map(item => ({
      value: item.device,
      label: this._translate.instant(`app.audience.technology.devices.${item.device}`),
    }));
    this.devicesListChange.emit(devices);
  }
  
  private _getRawGraphData(data: { [key: string]: string }[], relevantFields: string[]): { [key: string]: any } {
    return relevantFields.reduce((result, key) => {
      result[key] = data.map(item => {
        let value = parseFloat(item[key]) || 0;
        if (value % 1 !== 0) {
          value = Number(value.toFixed(this._fractions));
        }
        return { value, key: item.device };
      });
      
      return result;
    }, {});
  }
  
  
  private _getGraphData(data: { [key: string]: string }[], relevantFields: string[]): { [key: string]: any } {
    const xAxisData = data.map(({ device }) => this._translate.instant(`app.audience.technology.devices.${device}`));
    const config = this._dataConfig.totals.fields;
    return relevantFields.reduce((barChartData, key) => {
      barChartData[key] = {
        textStyle: {
          fontFamily: 'Lato',
        },
        grid: { top: 24, left: 24, bottom: 24, right: 24, containLabel: true },
        color: [config[key].colors[0]],
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#999999',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'Lato'
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: '#ebebeb'
            }
          }
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLabel: {
            color: '#999999',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'Lato'
          },
          axisTick: {
            length: 8,
            lineStyle: {
              color: '#ebebeb'
            }
          },
          axisLine: {
            lineStyle: {
              color: '#ebebeb'
            }
          }
        },
        tooltip: {
          backgroundColor: '#ffffff',
          borderColor: '#dadada',
          borderWidth: 1,
          extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
          textStyle: {
            color: '#999999'
          }
        },
        series: [{
          data: data.map(item => {
            let value = parseFloat(item[key]) || 0;
            if (value % 1 !== 0) {
              value = Number(value.toFixed(this._fractions));
            }
            return value;
          }),
          type: 'bar'
        }]
      };
      
      return barChartData;
    }, {});
  }
  
  private _getSummaryData(data: { [key: string]: string }[], relevantFields: string[]): Summary {
    return relevantFields.reduce((summaryData, key) => {
      const relevantTotal = this._tabsData.find(total => total.key === key);
      if (relevantTotal) {
        const totalValue = parseFloat(relevantTotal.value);
        summaryData[key] = data.map(item => {
          const itemValue = parseFloat(item[key]);
          let value = 0;
          if (key === 'avg_time_viewed') {
            value = Number((itemValue || 0).toFixed(this._fractions));
          } else if (!isNaN(itemValue) && !isNaN(totalValue) && itemValue !== 0) {
            value = (itemValue / totalValue) * 100;
            if (value % 1 !== 0) {
              value = Number(value.toFixed(this._fractions));
            }
          }
          return {
            key: item.device,
            name: this._translate.instant(`app.audience.technology.devices.${item.device}`),
            value: value,
            rawValue: itemValue,
            units: key === 'avg_time_viewed' ? 'min' : '%'
          };
        });
      }
      return summaryData;
    }, {});
  }
  
  private handleOverview(table: KalturaReportTable): void {
    const relevantFields = Object.keys(this._dataConfig.totals.fields);
    const { data, columns } = this._getOverviewData(table, relevantFields);
    
    this._columns = columns;
    this._barChartData = this._getGraphData(data, relevantFields);
    this._rawChartData = this._getRawGraphData(data, relevantFields);
    this._summaryData = this._getSummaryData(data, relevantFields);

    this._handleDevicesListChange(data);
  }
  
  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }
  
  private _updateGraphStyle(): void {
    const data = this._rawChartData[this._selectedMetrics];
    const series = data.map(({ value, key }) => {
      const isActive = this._selectedValues.length === 0 || this._selectedValues.indexOf(key) > -1;
      const color = isActive ? this._dataConfig.totals.fields[this._selectedMetrics].colors[0] : '#CCCCCC';
      return {
        value,
        itemStyle: { color }
      };
    });
  
    this._mergeChartData = { series: [{ data: series }] };
  }
  
  public _onSelectionChange(updateGraph = true): void {
    this._logger.trace('Handle device filter apply action by user', { selectedFilters: this._selectedValues, updateGraph });
    if (updateGraph) {
      this._updateGraphStyle();
    }

    this.deviceFilterChange.emit(this._selectedValues);
  }
  
  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
    this.metricChanged.emit(this._selectedMetrics);
    this._updateGraphStyle();
  }
  
  public resetDeviceFilters(emit = false, updateGraph = true): void {
    this._logger.trace('Handle reset device filters action by user', { emit, updateGraph });
    this._selectedValues = [];
    
    if (updateGraph) {
      this._updateGraphStyle();
    }
    
    if (emit) {
      this._onSelectionChange(updateGraph);
    }
  }
}
