import { EventEmitter, Inject, InjectionToken, Input, OnDestroy, Output, Directive } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { devicesFilterToServerValue } from 'shared/utils/devices-filter-to-server-value';
import { significantDigits } from 'shared/utils/significant-digits';
import { TrendService } from 'shared/services/trend.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { isArrayEquals } from 'shared/utils/is-array-equals';
import { Subject } from 'rxjs';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { reportTypeMap } from 'shared/utils/report-type-map';
import {RefineFilter} from "shared/components/filter/filter.component";

export const BaseDevicesReportConfig = new InjectionToken('BaseDevicesReportConfigService');

@Directive()
export abstract class BaseDevicesReportComponent implements OnDestroy {
  @Input() devicesList: { value: string, label: string }[] = [];
  @Input() allowedDevices: string[] = [];

  @Input() set selectedMetric(value: string) {
    switch (value) {
      case 'avg_time_viewed':
      case 'sum_time_viewed':
        this._distributionColorScheme = 'default'; // 'time' - color can be changed according to selected metric. Currently decided to keep the default color
        break;
      case 'unique_viewers':
        this._distributionColorScheme = 'default'; // 'viewers' - color can be changed according to selected metric. Currently decided to keep the default color
        break;
      case 'count_plays':
      default:
        this._distributionColorScheme = 'default';
        break;
    }
  }

  @Input() set deviceFilter(value: string[]) {
    const hasChanges = !isArrayEquals(this._devices, value);

    this._devicesSelectActive = true;

    if (!Array.isArray(value)) {
      return;
    }

    if (value.length) {
      this._devices = value;
      this._selectedDevices = value;
      this._filter.deviceIn = devicesFilterToServerValue(this._devices);
    } else {
      this._devices = [];
      this._selectedDevices = [];
      delete this._filter.deviceIn;
    }
    this._tags = this.devicesList.filter(({ value }) => this._selectedDevices.indexOf(value) > -1);
    this._pager.pageIndex = 1;

    if (hasChanges) {
      this._loadReport();
    }
  }

  @Input() set filter(value: DateChangeEvent) {
    if (value) {
      this._chartDataLoaded = false;
      this._filter.timeZoneOffset = value.timeZoneOffset;
      this._filter.fromDate = value.startDate;
      this._filter.toDate = value.endDate;
      this._filter.interval = value.timeUnits;
      this._reportInterval = value.timeUnits;
      this._pager.pageIndex = 1;
      this._loadReport();
    }
  }

  @Input() set refineFilter(value: RefineFilter) {
    if (value) {
      this._chartDataLoaded = false;
      this._filter.playbackTypeIn = value.filter(refineFilter => refineFilter.type === 'playbackType').map(refineFilter => refineFilter.value).join(analyticsConfig.valueSeparator);
      if (this._filter.playbackTypeIn === '') {
        delete this._filter.playbackTypeIn;
      }
      this._pager.pageIndex = 1;
      if (this._reportType) {
        this._loadReport();
      }
    }
  }

  @Output() deviceFilterChange = new EventEmitter<string[]>();
  @Output() onDrillDown = new EventEmitter<{ drillDown: string, reportType: KalturaReportType, name: string }>();

  private _paginationChanged = new Subject<void>();

  public abstract _name: string;
  protected abstract _defaultReportType: KalturaReportType;
  protected abstract _drillDownReportType: KalturaReportType;

  protected _iconType: string = null;
  protected _order = '-count_plays';
  protected _totalPlaysCount = 0;
  protected _devices: string[] = [];
  protected _reportType: KalturaReportType;

  public abstract _title: string;

  public _paginationChanged$ = this._paginationChanged.asObservable();
  public _distributionColorScheme: string;
  public _drillDown: string = null;
  public _firstTimeLoading = true;
  public _devicesSelectActive = false;
  public _tags: any[] = [];
  public _selectedDevices: string[] = [];
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });
  public _blockerMessage: AreaBlockerMessage = null;
  public _totalCount: number;
  public _columns: string[] = [];
  public _tableData: TableRow<any>[] = [];
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

  protected _showIcon = false;
  protected get showIcon(): boolean {
    return false;
  }

  protected abstract getRelevantCompareRow(tableData: { [key: string]: string }[], row: { [key: string]: string }): { [key: string]: string };

  constructor(private _reportService: ReportService,
              private _trendService: TrendService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _errorsManager: ErrorsManagerService,
              private _logger: KalturaLogger,
              @Inject(BaseDevicesReportConfig) _configService: ReportDataBaseConfig) {
    this._dataConfig = _configService.getConfig();

    setTimeout(() => {
      this._reportType = this._defaultReportType;
    });
  }

  ngOnDestroy() {
    this._paginationChanged.complete();
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
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
          this._tableData = [];
          this._totalPlaysCount = 0;
          this._totalCount = 0;

          // IMPORTANT to handle totals first, distribution rely on it
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle table
          }

          this._isBusy = false;
          this._firstTimeLoading = false;
          this._showIcon = !this._drillDown;

          this._loadTrendData();
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

  private _setPlaysTrend(row: any, compareValue: any, currentPeriodTitle: string, comparePeriodTitle: string): void {
    const currentValue = parseFloat(row['count_plays_raw']) || 0;
    compareValue = parseFloat(compareValue) || 0;
    const { value, direction } = this._trendService.calculateTrend(currentValue, compareValue);
    const tooltip = `${this._trendService.getTooltipRowString(currentPeriodTitle, ReportHelper.numberWithCommas(currentValue))}${this._trendService.getTooltipRowString(comparePeriodTitle, ReportHelper.numberWithCommas(compareValue))}`;
    row['plays_trend'] = {
      trend: value !== null ? value : '–',
      trendDirection: direction,
      tooltip: tooltip,
      units: value !== null ? '%' : '',
    };
  }

  private _loadTrendData(): void {
    const { startDate, endDate } = this._trendService.getCompareDates(this._filter.fromDate, this._filter.toDate);
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(this._filter.fromDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(this._filter.toDate, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(startDate, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(endDate, analyticsConfig.locale)}`;

    const compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
    compareFilter.fromDate = startDate;
    compareFilter.toDate = endDate;

    const reportConfig: ReportConfig = {
      reportType: this._reportType,
      filter: compareFilter,
      pager: this._pager,
      order: this._order
    };
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe(report => {
          if (report.table && report.table.header && report.table.data) {
            const { tableData } = this._reportService.parseTableData(report.table, this._dataConfig.table);

            this._tableData.forEach(row => {
              const relevantCompareRow = this.getRelevantCompareRow(tableData, row);
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

  private _getDrillDownFilterPropByReportType(): string {
    if ([reportTypeMap(KalturaReportType.browsers), reportTypeMap(KalturaReportType.browsersFamilies)].indexOf(this._reportType) > -1) {
      return 'browserFamilyIn';
    }

    if ([reportTypeMap(KalturaReportType.operatingSystem), reportTypeMap(KalturaReportType.operatingSystemFamilies)].indexOf(this._reportType) > -1) {
      return 'operatingSystemFamilyIn';
    }
  }

  public _onSortChanged(event) {
    const field = event.field === 'plays_distribution' ? 'count_plays' : event.field;
    if (event.data.length && field && event.order) {
      const order = event.order === 1 ? '+' + field : '-' + field;
      if (order !== this._order) {
        this._logger.trace('Handle sort changed action by user, reset page index to 1', { order });
        this._order = order;
        this._pager.pageIndex = 1;
        this._loadReport();
      }
    }
  }

  public _onPaginationChanged(event): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._paginationChanged.next();
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      this._pager.pageIndex = event.page + 1;
      this._loadReport();
    }
  }

  public _onDeviceFilterChange(): void {
    this._logger.trace('Handle device filter apply action by user', { selectedFilters: this._selectedDevices });
    this.deviceFilter = this._selectedDevices;
    this.deviceFilterChange.emit(this._selectedDevices);
  }

  public _onRemoveTag(item: { value: string, label: string }): void {
    this._logger.trace('Handle remove filter action by user', { item });
    this._selectedDevices = this._selectedDevices.filter(device => device !== item.value);
    this._onDeviceFilterChange();
  }

  public _onRemoveAllTags(): void {
    this._logger.trace('Handle remove all filters action by user');
    this._selectedDevices = [];
    this._onDeviceFilterChange();
  }

  public _onDrillDown(family: string): void {
    this._logger.trace(
      'Handle drill down to family action by user, reset page index to 1',
      { family, reportType: this._drillDownReportType }
    );
    this._drillDown = family;
    this._reportType = family ? this._drillDownReportType : this._defaultReportType;
    this._pager.pageIndex = 1;

    this.onDrillDown.emit({
      drillDown: this._drillDown,
      reportType: this._reportType,
      name: this._name,
    });

    const prop = this._getDrillDownFilterPropByReportType();
    if (family) {
      this._filter[prop] = family;
    } else {
      delete this._filter[prop];
    }

    this._loadReport();
  }

  private getPlaybackTypeFilters() {
    return (this._filter.playbackTypeIn || '').split(analyticsConfig.valueSeparator);
  }

  private isVodFilterSelected() {
    return !this._filter.playbackTypeIn || this.getPlaybackTypeFilters().includes('vod');
  }

  getColumnData() {
    return this.isVodFilterSelected() ? this._columns : this._columns.filter(column => column !== 'sum_time_viewed');
  }

  displayVodLabel(column: string) {
    return this.isVodFilterSelected() && this.getPlaybackTypeFilters().length > 1 && column === 'sum_time_viewed';
  }
}
