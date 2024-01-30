import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { BrowserService, ErrorsManagerService, NavigationDrillDownService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of as ObservableOf } from 'rxjs';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { UsersTableConfig } from './users-table.config';
import { CompareService } from 'shared/services/compare.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { SortEvent } from 'primeng/api';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss'],
  providers: [UsersTableConfig],
})
export class UsersTableComponent implements OnInit, OnDestroy {
  @Input() isCompareMode: boolean;
  @Input() allowUserDrilldown = true;
  @Input() filter: KalturaEndUserReportInputFilter;
  @Input() compareFilter: KalturaEndUserReportInputFilter;
  @Input() reportInterval: KalturaReportInterval;
  @Input() firstTimeLoading: boolean;
  @Input() filterChange: Observable<void>;

  private _reportType = reportTypeMap(KalturaReportType.userTopContent);
  private _dataConfig: ReportDataConfig;
  private _order = '-count_plays';

  public totalCount = 0;

  public _tableData: TableRow[] = [];
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: analyticsConfig.defaultPageSize });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;

  constructor(private _reportService: ReportService,
              private _browserService: BrowserService,
              private _frameEventManager: FrameEventManagerService,
              private _activatedRoute: ActivatedRoute,
              private _router: Router,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UsersTableConfig,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit() {
    this._loadReport();

    if (this.filterChange) {
      this.filterChange
        .pipe(cancelOnDestroy(this))
        .subscribe(() => {
          this._pager.pageIndex = 1;
          this._loadReport();
        });
    }
  }

  ngOnDestroy(): void {
  }

  private _loadReport(): void {
    this._isBusy = true;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this.filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this._reportType, filter: this.compareFilter, order: this._order, pager: this._pager };

        return this._reportService.getReport(compareReportConfig, this._dataConfig, false)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          this.totalCount = 0;
          if (compare) {
            this._handleCompare(report, compare);
          } else if (report.table && report.table.data && report.table.header) {
            this._handleTable(report.table); // handle graphs
          }

          this.firstTimeLoading = false;
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

  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this.filter.fromDate, to: this.filter.toDate };
    const comparePeriod = { from: this.compareFilter.fromDate, to: this.compareFilter.toDate };

    if (current.table && compare.table) {
      const { columns, tableData } = this._compareService.compareTableData(
        currentPeriod,
        comparePeriod,
        current.table,
        compare.table,
        this._dataConfig.table,
        this.reportInterval,
        'name',
      );
      this._columns = columns;
      this.totalCount = current.table.totalCount;
      this._tableData = tableData;
    }
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this.totalCount = table.totalCount;
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
    if (event.data.length && event.field && event.order && !this.isCompareMode) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._loadReport();
      }
    }
  }

  public _drillDown(row: TableRow): void {
    // following lines can be used if we want to detect obfuscated usernames on the client side
    // const obfuscated = new RegExp('^[A-Z0-9]{32}$');
    // if (row['name'] === 'Unknown' || obfuscated.test(row['name'])) {
    if (row['name'] === 'Unknown') {
      return; // ignore unknown user drill-down
    }

    this._navigationDrillDownService.drilldown('user', row['name'], true, row['partner_id']);
  }
}
