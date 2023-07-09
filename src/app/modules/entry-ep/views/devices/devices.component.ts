import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DevicesDataConfig } from './devices-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import {DateFilterUtils, DateRanges} from 'shared/components/date-filter/date-filter-utils';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { significantDigits } from 'shared/utils/significant-digits';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-ep-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  providers: [
    DevicesDataConfig,
    KalturaLogger.createLogger('EpDevicesComponent')
  ]
})
export class EpDevicesComponent implements OnInit, OnDestroy {

  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() endDate: Date;
  @Input() exporting = false;

  private _dataConfig: ReportDataConfig;
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 5, pageIndex: 1 });
  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _reportType: KalturaReportType = reportTypeMap(KalturaReportType.epWebcastTopPlatforms);
  private order = '-unique_combined_live_viewers';
  private _totalLiveViewersCount = 0;
  public _selectedMetrics: string;
  public _tableData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _dataConfigService: DevicesDataConfig,
              private _logger: KalturaLogger) {

    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
    this._loadReport();
  }

  ngOnDestroy() {
  }

  public _onPaginationChanged(event): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      this._pager.pageIndex = event.page + 1;
      this._loadReport({ table: this._dataConfig.table });
    }
  }

  public _onSortChanged(event) {
    const field = event.field === 'plays_distribution' ? 'count_plays' : event.field;
    if (event.data.length && field && event.order) {
      const order = event.order === 1 ? '+' + field : '-' + field;
      if (order !== this.order) {
        this._logger.trace('Handle sort changed action by user, reset page index to 1', { order });
        this.order = order;
        this._pager.pageIndex = 1;
        this._loadReport({ table: this._dataConfig.table });
      }
    }
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this.order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
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

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData.map((row, index) => {
      let liveViewersDistribution = 0;
      if (this._totalLiveViewersCount !== 0) {
        const countLiveViewers = parseFloat(row['unique_combined_live_viewers']) || 0;
        liveViewersDistribution = (countLiveViewers / this._totalLiveViewersCount) * 100;
      }
      liveViewersDistribution = significantDigits(liveViewersDistribution);
      row['live_viewer_distribution'] = ReportHelper.numberWithCommas(liveViewersDistribution);

      return row;
    });
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    if (this._tabsData.length) {
      this._totalLiveViewersCount = Number(this._tabsData[0].rawValue);
    }
  }

}
