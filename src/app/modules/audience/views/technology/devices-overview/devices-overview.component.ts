import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DevicesOverviewConfig } from './devices-overview.config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TrendService } from 'shared/services/trend.service';

export interface SummaryItem {
  key: string;
  name: string;
  value: number;
  units: string;
}

export interface Summary {
  [key: string]: SummaryItem[];
}

@Component({
  selector: 'app-devices-overview',
  templateUrl: './devices-overview.component.html',
  styleUrls: ['./devices-overview.component.scss'],
  providers: [DevicesOverviewConfig, ReportService]
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
    }
  }
  
  @Output() deviceFilterChange = new EventEmitter<string[]>();
  @Output() devicesListChange = new EventEmitter<{ value: string, label: string; }[]>();
  
  private _fractions = 2;
  
  public _selectedValues = [];
  public _blockerMessage: AreaBlockerMessage = null;
  public _selectedMetrics: string;
  public _barChartData: any = {};
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
              private _platformsConfigService: DevicesOverviewConfig) {
    this._dataConfig = _platformsConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  ngOnDestroy() {
  
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
          // IMPORTANT to handle totals first, summary rely on totals
          if (report.totals) {
            this.handleTotals(report.totals); // handle totals
          }
          
          if (report.table && report.table.header && report.table.data) {
            this.handleOverview(report.table); // handle overview
          }
          
          this._isBusy = false;
          
          this._loadTrendData();
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
  }
  
  private _loadTrendData() {
    const { startDay, endDay } = this._trendService.getCompareDates(this._filter.fromDay, this._filter.toDay);
    
    this._filter.fromDay = startDay;
    this._filter.toDay = endDay;
    const reportConfig: ReportConfig = {
      reportType: KalturaReportType.platforms,
      filter: this._filter,
      pager: this._pager,
      order: null
    };
    
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
          if (report.table && report.table.header && report.table.data) {
            const relevantFields = Object.keys(this._dataConfig.totals.fields);
            const data = this._getOverviewData(report.table, relevantFields);
            const compareData = this._getSummaryData(data, relevantFields);
            Object.keys(this._summaryData).forEach(key => {
              const compare = compareData[key];
              if (compare) {
                this._summaryData[key].forEach((device, index) => {
                  const currentValue = device.value;
                  const compareValue = compare[index].value;
                  const { value, direction } = this._trendService.calculateTrend(currentValue, compareValue);
                  device['trend'] = value;
                  device['trendDirection'] = direction;
                });
              }
            });
          } else {
            Object.keys(this._summaryData).forEach(key => {
              this._summaryData[key].forEach((device) => {
                const currentValue = device.value;
                const compareValue = 0;
                const { value, direction } = this._trendService.calculateTrend(currentValue, compareValue);
                device['trend'] = value;
                device['trendDirection'] = direction;
              });
            });
          }
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
            // TODO handle error
          }
        });
  }
  
  private _getOverviewData(table: KalturaReportTable, relevantFields: string[]): { [key: string]: string }[] {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    const data = tableData.reduce((data, item) => {
      if (this.allowedDevices.includes(item.device)) {
        data.push(item);
      } else {
        const hasValue = relevantFields.map(key => item.hasOwnProperty(key) ? parseFloat(item[key]) || 0 : 0).some(Boolean);
        
        if (hasValue) {
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
      }
      return data;
    }, []);
    
    // move other devices in the end
    const otherDevicesIndex = data.findIndex(({ device }) => device === 'OTHER');
    if (otherDevicesIndex !== -1) {
      data.push(data.splice(otherDevicesIndex, 1)[0]);
    }
    
    return data;
  }
  
  private _handleDevicesListChange(data: { [key: string]: string }[]): void {
    const devices = data.map(item => ({
      value: item.device,
      label: this._translate.instant(`app.audience.technology.devices.${item.device}`),
    }));
    this.devicesListChange.emit(devices);
  }
  
  private _getGraphData(data: { [key: string]: string }[], relevantFields: string[]): { [key: string]: any } {
    const xAxisData = data.map(({ device }) => this._translate.instant(`app.audience.technology.devices.${device}`));
    return relevantFields.reduce((barChartData, key) => {
      barChartData[key] = {
        grid: { top: 24, left: 54, bottom: 24, right: 24, containLabel: true },
        color: ['#00a784'],
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
            const value = parseFloat(item[key]) || 0;
            if (value % 1 !== 0) {
              return value.toFixed(this._fractions);
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
            units: key === 'avg_time_viewed' ? 'min' : '%'
          };
        });
      }
      return summaryData;
    }, {});
  }
  
  private handleOverview(table: KalturaReportTable): void {
    const relevantFields = Object.keys(this._dataConfig.totals.fields);
    const data = this._getOverviewData(table, relevantFields);
    
    this._barChartData = this._getGraphData(data, relevantFields);
    this._summaryData = this._getSummaryData(data, relevantFields);
    
    this._handleDevicesListChange(data);
  }
  
  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }
  
  public _onSelectionChange(): void {
    this.deviceFilterChange.emit(this._selectedValues);
  }
  
  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
  }
  
  public resetDeviceFilters(emit = false): void {
    this._selectedValues = [];
    
    if (emit) {
      this._onSelectionChange();
    }
  }
}
