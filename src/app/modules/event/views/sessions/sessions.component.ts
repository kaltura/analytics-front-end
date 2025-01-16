import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaFilterPager, KalturaPager, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType} from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {AppAnalytics, AuthService, ButtonType, ErrorsManagerService, NavigationDrillDownService, ReportConfig, ReportService} from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { SortEvent } from 'primeng/api';
import { SessionsConfig } from './sessions.config';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-event-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss'],
  providers: [SessionsConfig],
})
export class SessionsComponent implements OnDestroy {

  @Input() eventIn = '';
  @Input() set virtualEventLoaded(value: boolean) {
    if (value === true) {
      // use timeout to allow data binding to finish
      setTimeout(() => {
        this._loadReport();
      }, 0);
    }
  }
  @Input() exporting = false;
  @Input() startDate: Date;
  @Input() endDate: Date;

  private _reportType = reportTypeMap(KalturaReportType.epTopSessions);
  private _dataConfig: ReportDataConfig;
  private _order = '-unique_combined_live_viewers';

  public _tableData: TableRow[] = [];
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http') ? analyticsConfig.kalturaServer.uri : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private _partnerId = this._authService.pid;
  private _totalUniqueLiveViewers = 0;
  public _columns: string[] = [];
  public totalCount = 0;
  public firstTimeLoading = true;
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: 5 });
  private _filter = new KalturaReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;

  private SESSION_ID_RELEASE_DATE = new Date(2024, 6, 31);
  public _session_id_release_date = DateFilterUtils.formatMonthDayString(this.SESSION_ID_RELEASE_DATE, analyticsConfig.locale, 'long');
  public _displaySessions = true;
  public _displayDisclaimer = false;
  public _eventSessionEntries = null;

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _analytics: AppAnalytics,
              _dataConfigService: SessionsConfig,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnDestroy(): void {
  }

  private _loadReport(): void {
    this._eventSessionEntries = analyticsConfig.customData?.eventSessionEntries;debugger;
    this._displaySessions = this.endDate.getTime() > this.SESSION_ID_RELEASE_DATE.getTime();
    this._displayDisclaimer = this.endDate.getTime() > this.SESSION_ID_RELEASE_DATE.getTime() && this.startDate.getTime() <= this.SESSION_ID_RELEASE_DATE.getTime();
    if (this._displaySessions && this._eventSessionEntries !== '') {
      this._isBusy = true;
      this._blockerMessage = null;
      this.totalCount = 0;
      this._filter.virtualEventIdIn = this.eventIn;
      this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
      this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
      this._filter.toDate = Math.floor(new Date().getTime() / 1000);
      this._filter.interval = KalturaReportInterval.days;
      if (this._eventSessionEntries) {
        this._filter.eventSessionContextIdIn = this._eventSessionEntries.split(',').join(analyticsConfig.valueSeparator);
      }
      const reportConfig: ReportConfig = {reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager};
      this._reportService.getReport(reportConfig, this._dataConfig, false)
        .pipe(cancelOnDestroy(this))
        .subscribe((report) => {
            this._tableData = [];
            this.firstTimeLoading = false;
            if (report.totals && report.totals.data && report.totals.header) {
              this._handleTotals(report.totals); // handle totals
            }
            if (report.table && report.table.data && report.table.header) {
              this._handleTable(report.table); // handle table
            }
            this._isBusy = false;
            this._blockerMessage = null;
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
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    this._totalUniqueLiveViewers = tabsData[0].rawValue !== '' ? parseInt(tabsData[0].rawValue.toString()) : 0;
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this.totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData.map((item, index) => this._extendTableRow(item, index, this._pager));
  }

  private _extendTableRow (item: TableRow<string>, index: number, pager: KalturaPager): TableRow<string> {
    item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['event_session_context_id']}/width/256/height/144`;
    item['liveViewersRate'] = (parseInt(item['unique_combined_live_viewers']) / this._totalUniqueLiveViewers * 100).toFixed(1);
    return item;
  }

  public _onPaginationChanged(event: { page: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._analytics.trackButtonClickEvent(ButtonType.Filter, 'Events_event_sessions_paginate', this._pager.pageIndex.toString(), 'Event_dashboard');
      this._loadReport();
    }
  }

  public _onSortChanged(event: SortEvent): void {
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._analytics.trackButtonClickEvent(ButtonType.Filter, 'Events_event_sessions_sort', event.field, 'Event_dashboard');
        this._order = order;
        this._pager.pageIndex = 1;
        this._loadReport();
      }
    }
  }

  public _drillDown(row: TableRow): void {
    this._analytics.trackButtonClickEvent(ButtonType.Load, 'Events_event_sessions_session_click', null, 'Event_dashboard');
    this._navigationDrillDownService.drilldown('entry-ep', row['event_session_context_id'], true, this._partnerId);
  }
}


