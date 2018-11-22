import { EventEmitter, Inject, InjectionToken, Input, OnDestroy, Output } from '@angular/core';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { devicesFilterToServerValue } from 'shared/utils/devices-filter-to-server-value';
import { significantDigits } from 'shared/utils/significant-digits';
import { TrendService } from 'shared/services/trend.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';

export const BaseDevicesReportConfig = new InjectionToken('BaseDevicesReportConfigService');

export abstract class BaseDevicesReportComponent implements OnDestroy {
  @Input() devicesList: { value: string, label: string }[] = [];
  @Input() allowedDevices: string[] = [];
  
  @Input() set deviceFilter(value: string[]) {
    this._devicesSelectActive = true;

    if (!Array.isArray(value)) {
      return;
    }
    
    if (value.length) {
      this._devices = value;
      this._selectedDevices = value;
      this._filter.deviceIn = devicesFilterToServerValue(this._devices);
    } else {
      this._devices = null;
      this._selectedDevices = [];
      delete this._filter.deviceIn;
    }
    this._tags = this.devicesList.filter(({ value }) => this._selectedDevices.includes(value));
    this._pager.pageIndex = 1;
    this._loadReport();
  }
  
  @Input() set filter(value: DateChangeEvent) {
    if (value) {
      this._chartDataLoaded = false;
      this._filter.timeZoneOffset = value.timeZoneOffset;
      this._filter.fromDay = value.startDay;
      this._filter.toDay = value.endDay;
      this._filter.interval = value.timeUnits;
      this._reportInterval = value.timeUnits;
      this._pager.pageIndex = 1;
      this._loadReport();
    }
  }
  
  @Output() deviceFilterChange = new EventEmitter<string[]>();
  
  protected abstract _reportType: KalturaReportType;
  
  protected _order = '-count_plays';
  protected _totalPlaysCount = 0;
  protected _devices: string[] = [];
  
  public abstract _title: string;
  
  public _firstTimeLoading = true;
  public _devicesSelectActive = false;
  public _tags: any[] = [];
  public _selectedDevices: string[] = [];
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });
  public _blockerMessage: AreaBlockerMessage = null;
  public _totalCount: number;
  public _columns: string[] = [];
  public _tableData: any[] = [];
  public _isBusy = false;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
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
              @Inject(BaseDevicesReportConfig) _configService: ReportDataBaseConfig) {
    this._dataConfig = _configService.getConfig();
  }
  
  ngOnDestroy() {
  
  }
  
  private _insertColumnAfter(column: string, after: string, columns: string[]): void {
    const countPlaysIndex = columns.indexOf(after);
    if (countPlaysIndex !== -1) {
      columns.splice(countPlaysIndex + 1, 0, column);
    }
  }
  
  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._insertColumnAfter('plays_distribution', 'count_plays', columns);
    this._insertColumnAfter('plays_trend', 'plays_distribution', columns);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData.map(row => {
      let playsDistribution = 0;
      if (this._totalPlaysCount !== 0) {
        const countPlays = parseFloat(row['count_plays']) || 0;
        playsDistribution = (countPlays / this._totalPlaysCount) * 100;
      }
      playsDistribution = significantDigits(playsDistribution);
      row['count_plays_raw'] = row['count_plays'];
      row['count_plays'] = ReportHelper.numberOrZero(row['count_plays']);
      row['plays_distribution'] = ReportHelper.numberWithCommas(playsDistribution);
      
      return row;
    });
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    if (tabsData.length) {
      this._totalPlaysCount = Number(tabsData[0].value);
    }
  }
  
  private _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = {
      reportType: this._reportType,
      filter: this._filter,
      pager: this._pager,
      order: this._order
    };
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
          // IMPORTANT to handle totals first, distribution rely on it
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle table
          }
          
          this._isBusy = false;
          this._firstTimeLoading = false;
          
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
                  this._loadReport();
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
  
  private _setPlaysTrend(row: any, compareValue: any, currentPeriodTitle: string, comparePeriodTitle: string): void {
    const currentValue = parseFloat(row['count_plays_raw']) || 0;
    compareValue = parseFloat(compareValue) || 0;
    const { value, direction } = this._trendService.calculateTrend(currentValue, compareValue);
    const tooltip = `
      ${this._trendService.getTooltipRowString(currentPeriodTitle, ReportHelper.numberWithCommas(currentValue))}
      ${this._trendService.getTooltipRowString(comparePeriodTitle, ReportHelper.numberWithCommas(compareValue))}
    `;
    row['plays_trend'] = {
      trend: value !== null ? value : '–',
      trendDirection: direction,
      tooltip: tooltip,
      units: value !== null ? '%' : '',
    };
  }
  
  private _loadTrendData(): void {
    const { startDay, endDay } = this._trendService.getCompareDates(this._filter.fromDay, this._filter.toDay);
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(this._filter.fromDay, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._filter.toDay, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(startDay, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(endDay, analyticsConfig.locale)}`;
    
    this._filter.fromDay = startDay;
    this._filter.toDay = endDay;
    
    const reportConfig: ReportConfig = {
      reportType: this._reportType,
      filter: this._filter,
      pager: this._pager,
      order: this._order,
      objectIds: devicesFilterToServerValue(this._devices)
    };
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
        if (report.table && report.table.header && report.table.data) {
          const { tableData } = this._reportService.parseTableData(report.table, this._dataConfig.table);
          this._tableData.forEach(row => {
            const relevantCompareRow = tableData.find(item => item.browser === row.browser);
            const compareValue = relevantCompareRow ? relevantCompareRow['count_plays'] : 0;
            this._setPlaysTrend(row, compareValue, currentPeriodTitle, comparePeriodTitle);
          });
        } else {
          this._tableData.forEach(row => {
            this._setPlaysTrend(row, 0, currentPeriodTitle, comparePeriodTitle);
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
            row['plays_trend'] = { trend: 'N/A' };
          });
        }
      });
  }
  
  public _onSortChanged(event) {
    const field = event.field === 'plays_distribution' ? 'count_plays' : event.field;
    if (event.data.length && field && event.order) {
      const order = event.order === 1 ? '+' + field : '-' + field;
      if (order !== this._order) {
        this._order = order;
        this._loadReport();
      }
    }
  }
  
  public _onPaginationChanged(event): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._loadReport();
    }
  }
  
  public _onDeviceFilterChange(): void {
    this.deviceFilter = this._selectedDevices;
    this.deviceFilterChange.emit(this._selectedDevices);
  }
  
  public _onRemoveTag(item: { value: string, label: string }): void {
    this._selectedDevices = this._selectedDevices.filter(device => device !== item.value);
    this._onDeviceFilterChange();
  }
  
  public _onRemoveAllTags(): void {
    this._selectedDevices = [];
    this._onDeviceFilterChange();
  }
}
