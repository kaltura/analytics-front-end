import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { Observable, of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {
  AuthService,
  BrowserService,
  ErrorsManagerService,
  NavigationDrillDownService,
  Report,
  ReportConfig,
  ReportHelper,
  ReportService
} from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { map, switchMap } from 'rxjs/operators';
import { SortEvent } from 'primeng/api';
import { EntriesTableConfig } from './entries-table.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { ViewConfig } from "configuration/view-config";

@Component({
  selector: 'manual-playlist-entries-table',
  templateUrl: './entries-table.component.html',
  styleUrls: ['./entries-table.component.scss'],
  providers: [EntriesTableConfig],
})
export class ManualPlaylistEntriesTableComponent implements OnInit, OnDestroy {
  @Input() isCompareMode: boolean;
  @Input() filter: KalturaEndUserReportInputFilter;
  @Input() compareFilter: KalturaEndUserReportInputFilter;
  @Input() reportInterval: KalturaReportInterval;
  @Input() firstTimeLoading: boolean;
  @Input() filterChange: Observable<void>;
  @Input() userDrilldown = false;
  @Input() summary: {[key: string]: any} = {};

  @Output() drillDown: EventEmitter<{entry: string, name: string, pid: string, source: string}> = new EventEmitter();

  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http') ? analyticsConfig.kalturaServer.uri : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private _partnerId = this._authService.pid;
  private _reportType = reportTypeMap(KalturaReportType.topContentCreator);
  private _dataConfig: ReportDataConfig;
  private _order = '-count_loads';

  public totalCount = 0;

  public _tableData: TableRow[] = [];
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: analyticsConfig.defaultPageSize });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _viewConfig: ViewConfig =  analyticsConfig.viewsConfig.playlist.performance;

  constructor(private _reportService: ReportService,
              private _compareService: CompareService,
              private _browserService: BrowserService,
              private _router: Router,
              private _authService: AuthService,
              private _activatedRoute: ActivatedRoute,
              private _frameEventManager: FrameEventManagerService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: EntriesTableConfig,
              private _navigationDrillDownService: NavigationDrillDownService) {
  }

  ngOnInit() {
    this._dataConfig = this._dataConfigService.getConfig();
    this._loadReport();

    if (this.filterChange) {
      this.filterChange
        .pipe(cancelOnDestroy(this))
        .subscribe(() => {
          this._pager.pageIndex = 1;
          setTimeout(() => {
            this._loadReport();
          }, 200);
        });
    }
  }

  ngOnDestroy(): void {
  }

  private _loadReport(): void {
    this._isBusy = true;
    if (this.userDrilldown) {
      this._dataConfig.table.fields['total_completion_rate'] = {
        format: value =>  ReportHelper.percents(value / 100, false, true),
        sortOrder: 8
      };
    }
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
        'object_id',
      );
      this._columns = columns;
      this.totalCount = current.table.totalCount || 0;
      this._tableData = tableData;
      this.addThumbnailData();
    }
  }

  private addThumbnailData(): void {
    this._tableData.forEach(entryData => {
      const thumbnailUrl = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${entryData.object_id}/width/256/height/144?rnd=${Math.random()}`;
      entryData['thumbnailUrl'] = thumbnailUrl;
    });
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this.totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData;
    this.addThumbnailData();
    if (!this.userDrilldown) {
      this._columns.splice(2, 0, "plays_distribution");
      // calculate plays distribution
      this._tableData.forEach(entryData => {
        const distribution = parseInt(entryData.count_plays.replace(/,/g, '')) / parseInt(this.summary.total_plays) * 100;
        entryData['plays_distribution'] = Math.round(distribution * 100) / 100;
      });
    }
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
    this.drillDown.emit({entry: row['object_id'], name: row['entry_name'], pid: row['partner_id'], source: row['entry_source']});
  }
}


