import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BarChartRow } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';
import { DeviceIconPipe } from 'shared/pipes/device-icon.pipe';
import { LiveDevicesConfig } from './live-devices.config';
import { filter } from 'rxjs/operators';
import { LiveGeoWidgetData } from '../live-geo/live-geo.widget';
import { LiveDevicesWidget } from './live-devices.widget';

@Component({
  selector: 'app-live-devices',
  templateUrl: './live-devices.component.html',
  styleUrls: ['./live-devices.component.scss'],
  providers: [KalturaLogger.createLogger('LiveDevicesComponent')]
})
export class LiveDevicesComponent implements OnInit, OnDestroy {
  @Input() entryId: string = null;
  
  public _dateFilter: DateChangeEvent;
  protected _componentId = 'devices-overview';
  
  private readonly _allowedDevices = ['Computer', 'Mobile', 'Tablet', 'Game console', 'Digital media receiver'];
  private _fractions = 1;
  private _reportType = KalturaReportType.platforms;
  private _tabsData: Tab[] = [];
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _summaryData: BarChartRow[] = [];
  public _isBusy = false;
  public _dataConfig: ReportDataConfig;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _selectedMetric: string;
  public _totalCount = 0;
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _deviceIconPipe = new DeviceIconPipe();
  
  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: LiveDevicesConfig,
              private _liveDevicesWidget: LiveDevicesWidget) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetric = this._dataConfig[ReportDataSection.totals].preSelected;
  }
  
  ngOnInit() {
    this._isBusy = true;
    
    this._liveDevicesWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._liveDevicesWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._liveDevicesWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(data => {
        this._isBusy = false;
        console.warn(data);
      });
  }
  
  ngOnDestroy() {
  }
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    if (this.entryId) {
      this._filter.entryIdIn = this.entryId;
    }
    
    const reportConfig: ReportConfig = {
      reportType: this._reportType,
      filter: this._filter,
      order: null
    };
    
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
          this._tabsData = [];
          this._summaryData = [];
          
          // IMPORTANT to handle totals first, summary rely on totals
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }
          
          if (report.table && report.table.header && report.table.data) {
            this._handleOverview(report.table); // handle overview
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
              // this._loadReport();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
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
    
    return { data, columns };
  }
  
  private _getSummaryData(data: { [key: string]: string }[]): BarChartRow[] {
    const key = this._selectedMetric;
    const getValue = (itemValue, totalValue) => {
      let value = 0;
      if (!isNaN(itemValue) && !isNaN(totalValue) && totalValue !== 0) {
        value = (itemValue / totalValue) * 100;
        if (value % 1 !== 0) {
          value = Number(value.toFixed(this._fractions));
        }
      }
      return value;
    };
    
    const relevantCurrentTotal = this._tabsData.find(total => total.key === key);
    if (relevantCurrentTotal) {
      const totalValue = parseFloat(relevantCurrentTotal.value);
      
      return data.map((item, index) => {
        const rawValue = parseFloat(item[key]);
        const currentValue = getValue(rawValue, totalValue);
        
        return {
          value: currentValue,
          tooltip: { value: ReportHelper.numberOrZero(rawValue), label: this._translate.instant(`app.entry.count_plays`) },
          label: this._translate.instant(`app.audience.technology.devices.${item.device}`),
          icon: this._deviceIconPipe.transform(item.device),
        };
      });
    }
    
    return [];
  }
  
  private _handleOverview(table: KalturaReportTable): void {
    const relevantFields = Object.keys(this._dataConfig.totals.fields);
    const { data } = this._getOverviewData(table, relevantFields);
    
    this._totalCount = table.totalCount;
    this._summaryData = this._getSummaryData(data);
  }
  
  private _handleTotals(totals: KalturaReportTotal, compare?: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetric);
  }
}
