import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import {
  AuthService,
  BrowserService,
  ErrorsManagerService,
  NavigationDrillDownService,
  Report,
  ReportConfig,
  ReportService
} from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import {
  KalturaEndUserReportInputFilter,
  KalturaFilterPager, KalturaPager,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportTotal,
  KalturaReportType
} from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { EntriesTableConfig } from './entries-table.config';
import { CompareService } from 'shared/services/compare.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { SortEvent } from 'primeng/api';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-entries-table',
  templateUrl: './entries-table.component.html',
  styleUrls: ['./entries-table.component.scss'],
  providers: [EntriesTableConfig],
})
export class EntriesTableComponent implements OnInit {
  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() endDate: Date;

  @Output() totalChanged = new EventEmitter<number>();

  private _reportType = reportTypeMap(KalturaReportType.epWebcastTopRecording);
  private _dataConfig: ReportDataConfig;
  private _order = '-count_plays';
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  private _partnerId = this._authService.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;

  public totalCount = 0;
  public _summaryData: {[key: string]: any} = {};
  public _tableData: TableRow[] = [];
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: analyticsConfig.defaultPageSize });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;

  constructor(private _reportService: ReportService,
              private _browserService: BrowserService,
              private _frameEventManager: FrameEventManagerService,
              private _activatedRoute: ActivatedRoute,
              private _authService: AuthService,
              private _router: Router,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: EntriesTableConfig,
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

  private _extendTableRow (item: TableRow<string>, index: number, pager: KalturaPager): TableRow<string> {
    item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['entry_id']}/width/256/height/144`;
    return item;
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
    this._tableData = tableData.map((item, index) => this._extendTableRow(item, index, this._pager));
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
        this._loadReport();
      }
    }
  }

  public _drillDown(row: TableRow): void {
    this._navigationDrillDownService.drilldown('entry', row['entry_id'], false);
  }
}
