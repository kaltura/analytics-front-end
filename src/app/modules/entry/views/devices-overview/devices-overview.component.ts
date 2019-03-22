import { Component, Input, OnDestroy } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
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
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { BarChartRow } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';
import { DeviceIconPipe } from 'shared/pipes/device-icon.pipe';

export interface SummaryItem {
  key: string;
  name: string;
  value: number;
  rawValue: number;
  units: string;
  compareUnits: string;
  compare?: boolean;
  tooltip?: string;
  trend?: number;
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
  
  public _dateFilter: DateChangeEvent;
  protected _componentId = 'devices-overview';
  
  private readonly _allowedDevices = ['Computer', 'Mobile', 'Tablet', 'Game console', 'Digital media receiver'];
  private _fractions = 1;
  private _reportType = KalturaReportType.platforms;
  private _tabsData: Tab[] = [];
  private _compareTabsData: Tab[] = [];
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _selectedMetrics: string;
  public _barChartData: { [key: string]: any; } = {};
  public _summaryData: BarChartRow[] = [];
  public _isBusy = false;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _dataConfig: ReportDataConfig;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _selectedMetric: string;
  public _totalCount = 0;
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _currentPeriod: { from: number, to: number };
  public _comparePeriod: { from: number, to: number };
  public _currentPeriodLabel: string;
  public _comparePeriodLabel: string;
  public _deviceIconPipe = new DeviceIconPipe();
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
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
    this._currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    this._currentPeriodLabel = this._getPeriodLabel(this._currentPeriod);
    if (this.entryId) {
      this._filter.entryIdIn = this.entryId;
    }
    
    const reportConfig: ReportConfig = {
      reportType: this._reportType,
      filter: this._filter,
      pager: this._pager,
      order: null
    };
    
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(
        cancelOnDestroy(this),
        switchMap(report => {
          if (!this._isCompareMode) {
            return ObservableOf({ report, compare: null });
          }
          
          if (this.entryId) {
            this._compareFilter.entryIdIn = this.entryId;
          }
          
          const compareReportConfig: ReportConfig = {
            reportType: this._reportType,
            filter: this._compareFilter,
            pager: this._pager,
            order: null
          };
          
          return this._reportService.getReport(compareReportConfig, this._dataConfig)
            .pipe(map(compare => ({ report, compare })));
        }))
      .subscribe(({ report, compare }) => {
          this._tabsData = [];
          this._compareTabsData = [];
          this._summaryData = [];
          
          if (compare) {
            this._comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
            this._comparePeriodLabel = this._getPeriodLabel(this._comparePeriod);

            this._handleCompare(report, compare);
          } else {
            this._comparePeriod = null;
            this._comparePeriodLabel = null;
            
            // IMPORTANT to handle totals first, summary rely on totals
            if (report.totals) {
              this._handleTotals(report.totals); // handle totals
            }
            
            if (report.table && report.table.header && report.table.data) {
              this._handleOverview(report.table); // handle overview
            }
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
  
  private _getSummaryData(data: { [key: string]: string }[], compareData?: { [key: string]: string }[]): BarChartRow[] {
    const key = this._selectedMetric;
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(this._filter.fromDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._filter.toDate, analyticsConfig.locale)}`;
    const comparePeriodTitle = this._compareFilter
      ? `${DateFilterUtils.formatMonthDayString(this._compareFilter.fromDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._compareFilter.toDate, analyticsConfig.locale)}`
      : null;
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
      
      const relevantCompareTotal = this._compareTabsData.find(total => total.key === key);
      const compareTotalValue = relevantCompareTotal ? parseFloat(relevantCompareTotal.value) : 0;
      
      return data.map((item, index) => {
        const rawValue = parseFloat(item[key]);
        const currentValue = getValue(rawValue, totalValue);
        
        if (compareData) {
          const compareRawValue = parseFloat(compareData[index][key]);
          const compareValue = getValue(compareRawValue, compareTotalValue);
  
          const { value, direction } = this._trendService.calculateTrend(Number(rawValue), Number(compareRawValue));
          const trend = {
            value: value !== null ? value : '–',
            trend: direction,
            units: value !== null ? '%' : '',
            tooltip: `${this._trendService.getTooltipRowString(this._currentPeriodLabel, rawValue)}${this._trendService.getTooltipRowString(this._comparePeriodLabel, compareRawValue)}`,
          };

          return {
            trend,
            tooltip: [
              { value: ReportHelper.numberOrZero(rawValue), label: this._translate.instant(`app.entry.count_plays`) },
              { value: ReportHelper.numberOrZero(compareRawValue), label: this._translate.instant(`app.entry.count_plays`) },
            ],
            value: [currentValue, compareValue],
            label: this._translate.instant(`app.audience.technology.devices.${item.device}`),
            icon: this._deviceIconPipe.transform(item.device),
          };
        }
        
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
    
    if (compare) {
      this._compareTabsData = this._reportService.parseTotals(compare, this._dataConfig.totals, this._selectedMetric);
    }
  }
  
  private _getPeriodLabel(period: { from: number, to: number }): string {
    return `${DateFilterUtils.formatMonthDayString(period.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(period.to, analyticsConfig.locale)}`;
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    if (current.totals) {
      this._handleTotals(current.totals, compare.totals); // handle totals
    }
    
    if (current.table && current.table.data) {
      const compareTable = compare.table && compare.table.data ? compare.table : Object.assign({}, current.table, { data: '' });
      const relevantFields = Object.keys(this._dataConfig.totals.fields);
      const { data: currentData } = this._getOverviewData(current.table, relevantFields);
      const { data: compareData } = this._getOverviewData(compareTable, relevantFields);
      
      const uniqueKeys = Array.from(new Set([...currentData, ...compareData].map(({ device }) => device)));
      const updateCollection = collection => key => {
        if (!collection.find(({ device }) => key === device)) {
          collection.push(relevantFields.reduce((result, field) => (result[field] = '0', result), { device: key }));
        }
      };
      const arrangeKeys = data => {
        // move other devices in the end
        const otherDevicesIndex = data.findIndex(({ device }) => device === 'OTHER');
        if (otherDevicesIndex !== -1) {
          data.push(data.splice(otherDevicesIndex, 1)[0]);
        }
      };
      
      const updateCurrentData = updateCollection(currentData);
      const updateCompareData = updateCollection(compareData);
      
      uniqueKeys.forEach(key => {
        updateCurrentData(key);
        updateCompareData(key);
      });
      
      arrangeKeys(currentData);
      arrangeKeys(compareData);
      
      this._summaryData = this._getSummaryData(currentData, compareData);
    }
  }
}
