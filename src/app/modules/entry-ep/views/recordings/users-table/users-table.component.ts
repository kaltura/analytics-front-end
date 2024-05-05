import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import {AppAnalytics, BrowserService, ButtonType, ErrorsManagerService, NavigationDrillDownService, Report, ReportConfig, ReportService} from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import {
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportTotal,
  KalturaReportType
} from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { UsersTableConfig } from './users-table.config';
import { CompareService } from 'shared/services/compare.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { SortEvent } from 'primeng/api';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss'],
  providers: [UsersTableConfig],
})
export class UsersTableComponent implements OnInit {
  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() endDate: Date;

  @Output() totalChanged = new EventEmitter<number>();

  private _reportType = reportTypeMap(KalturaReportType.epWebcastVodUserTopContent);
  private _dataConfig: ReportDataConfig;
  private _order = '-count_plays';
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public totalCount = 0;
  public _summaryData: {[key: string]: any} = {};
  public _tableData: TableRow[] = [];
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: analyticsConfig.defaultPageSize });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;

  constructor(private _reportService: ReportService,
              private _analytics: AppAnalytics,
              private _errorsManager: ErrorsManagerService,
              _dataConfigService: UsersTableConfig,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit() {
    if (this.entryIdIn.length) {
      this._loadReport();
    }
  }

  private _loadReport(): void {
    this._isBusy = true;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(switchMap(report => {
        return ObservableOf({ report });
      }))
      .subscribe(({ report }) => {
          this._tableData = [];
          this.totalCount = 0;
          if (report.totals && report.totals.data) {
            this._handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.data && report.table.header) {
            this._handleTable(report.table);
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

  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, 'count_plays');
    tabsData.forEach(tab => {
      this._summaryData[tab.key] = tab.value;
      if (tab.key === 'count_plays') {
        this._summaryData['total_plays'] = tab.rawValue;
      }
    });
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this.totalCount = table.totalCount;
    this.totalChanged.emit(this.totalCount);
    this._columns = columns;
    this._tableData = tableData;
  }

  public _onPaginationChanged(event: { page: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._loadReport();
    }
  }

  public _onSortChanged(event: SortEvent): void {
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        const trackEventValues = {
          'name': 'name',
          'count_loads': 'impressions',
          'sum_vod_view_period': 'minutes',
          'avg_completion_rate': 'completion'

        };
        this._analytics.trackButtonClickEvent(ButtonType.Filter, 'Events_session_recordings_viewers_sort', trackEventValues[event.field]);
        this._loadReport();
      }
    }
  }

  public _drillDown(row: TableRow): void {
    if (row['name'] === 'Unknown') {
      return; // ignore unknown user drill-down
    }

    this._navigationDrillDownService.drilldown('user', row['name'], true, row['partner_id']);
  }
}
