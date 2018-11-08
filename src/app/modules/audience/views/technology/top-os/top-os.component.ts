import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TopOsConfig } from './top-os.config';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { devicesFilterToServerValue } from 'shared/utils/devices-filter-to-server-value';
import { significantDigits } from 'shared/utils/significant-digits';

@Component({
  selector: 'app-top-os',
  templateUrl: './top-os.component.html',
  styleUrls: ['./top-os.component.scss'],
  providers: [TopOsConfig, ReportService]
})
export class TopOsComponent implements OnDestroy {
  @Input() devicesList: { value: string, label: string }[] = [];
  @Input() allowedDevices: string[] = [];
  
  @Input() set deviceFilter(value: string[]) {
    if (!Array.isArray(value)) {
      return;
    }
    
    if (value.length) {
      this._devices = value;
      this._selectedDevices = value;
      this._reportType = KalturaReportType.platforms;
    } else {
      this._devices = null;
      this._selectedDevices = [];
      this._reportType = KalturaReportType.operatingSystem;
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
  
  private _order = '-count_plays';
  private _totalPlaysCount = 0;
  private _reportType = KalturaReportType.operatingSystem;
  private _devices: string[] = [];
  
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
              private _translate: TranslateService,
              private _authService: AuthService,
              private _errorsManager: ErrorsManagerService,
              private _topOsConfigService: TopOsConfig) {
    this._dataConfig = _topOsConfigService.getConfig();
  }
  
  ngOnDestroy() {
  
  }
  
  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    const countPlaysIndex = columns.indexOf('count_plays');
    if (countPlaysIndex !== -1) {
      columns.splice(countPlaysIndex + 1, 0, 'plays_distribution');
    }
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData.map(row => {
      let playsDistribution = 0;
      if (this._totalPlaysCount !== 0) {
        const countPlays = parseFloat(row['count_plays']) || 0;
        playsDistribution = (countPlays / this._totalPlaysCount) * 100;
      }
      playsDistribution = significantDigits(playsDistribution);
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
      order: this._order,
      objectIds: devicesFilterToServerValue(this._devices)
    };
    this._reportService.getReport(reportConfig, this._dataConfig, false)
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
  
  public _onSortChanged(event): void {
    event.field = event.field === 'plays_distribution' ? 'count_plays' : event.field;
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
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
