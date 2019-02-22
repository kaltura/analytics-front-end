import { Component, Input, OnDestroy } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { DevicesOverviewConfig } from './devices-overview.config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TrendService } from 'shared/services/trend.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { EntryBase } from '../entry-base/entry-base';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { CompareService } from 'shared/services/compare.service';

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
  selector: 'app-entry-devices-overview',
  templateUrl: './devices-overview.component.html',
  styleUrls: ['./devices-overview.component.scss'],
  providers: [
    KalturaLogger.createLogger('DevicesOverviewComponent'),
    DevicesOverviewConfig,
    ReportService,
  ]
})
export class EntryDevicesOverviewComponent extends EntryBase implements OnDestroy {
  @Input() entryId: string = null;
  
  protected _dateFilter: DateChangeEvent;
  protected _componentId = 'devices-overview';
  
  private readonly _allowedDevices = ['Computer', 'Mobile', 'Tablet', 'Game console', 'Digital media receiver'];
  private _fractions = 1;
  public _blockerMessage: AreaBlockerMessage = null;
  public _selectedMetrics: string;
  public _barChartData: { [key: string]: any; } = {};
  public _summaryData: SummaryItem[] = [];
  public _summaryDataRight: SummaryItem[] = [];
  public _isBusy = false;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _tabsData: Tab[] = [];
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _dataConfig: ReportDataConfig;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _selectedMetric: string;
  public _filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: DevicesOverviewConfig,
              private _trendService: TrendService) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetric = this._dataConfig[ReportDataSection.totals].preSelected;
  }
  
  ngOnDestroy() {
  }
  
  protected _updateRefineFilter(): void {
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
  
  protected _loadReport(): void {
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
          this._barChartData = {};
          this._summaryData = [];
          
          // IMPORTANT to handle totals first, summary rely on totals
          if (report.totals) {
            this.handleTotals(report.totals); // handle totals
          }
          
          if (report.table && report.table.header && report.table.data) {
            this.handleOverview(report.table); // handle overview
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
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
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
  
  private _getOverviewData(table: KalturaReportTable, relevantFields: string[]): { data: { [key: string]: string }[], columns: string[] } {
    const { tableData, columns } = this._reportService.parseTableData(table, this._dataConfig.table);
    const data = tableData.reduce((data, item) => {
      if (this._allowedDevices.indexOf(item.device) > -1) {
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
        grid: { top: 24, left: 24, bottom: 0, right: 24, containLabel: true },
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
          trigger: 'axis',
          backgroundColor: '#ffffff',
          borderColor: '#dadada',
          borderWidth: 1,
          extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
          textStyle: {
            color: '#999999'
          },
          axisPointer: {
            type: 'shadow',
            shadowStyle: {
              color: 'rgba(150,150,150,0.1)'
            }
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
    const { data } = this._getOverviewData(table, relevantFields);
    
    this._barChartData = this._getGraphData(data, relevantFields)[this._selectedMetric];
    this._summaryData = this._getSummaryData(data, relevantFields)[this._selectedMetric];
    if (this._summaryData.length > 3) {
      this._summaryDataRight = this._summaryData.slice(3);
      this._summaryData = this._summaryData.slice(0, 3);
    }
  }
  
  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetric);
  }
}
