import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { Observable, of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { BrowserService, ErrorsManagerService, NavigationDrillDownService, Report, ReportConfig, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { map, switchMap } from 'rxjs/operators';
import { SortEvent } from 'primeng/api';
import { ContextTableConfig } from './context-table.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { fixContextTableName } from 'shared/utils/fix-context-table-name';

@Component({
  selector: 'app-context-table',
  templateUrl: './context-table.component.html',
  styleUrls: ['./context-table.component.scss'],
  providers: [ContextTableConfig, ReportService],
})
export class ContextTableComponent implements OnInit, OnDestroy {
  @Input() isCompareMode: boolean;
  @Input() filter: KalturaEndUserReportInputFilter;
  @Input() compareFilter: KalturaEndUserReportInputFilter;
  @Input() reportInterval: KalturaReportInterval;
  @Input() firstTimeLoading: boolean;
  @Input() filterChange: Observable<void>;
  
  @ViewChild('overlay', { static: false }) _overlay: OverlayComponent;
  
  private _reportType = reportTypeMap(KalturaReportType.topPlaybackContext);
  private _dataConfig: ReportDataConfig;
  private _order = '-count_loads';
  
  public _contextId: number;
  public _totalCount = 0;
  public _tableData: TableRow[] = [];
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: analyticsConfig.defaultPageSize });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  
  constructor(private _reportService: ReportService,
              private _compareService: CompareService,
              private _browserService: BrowserService,
              private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _frameEventManager: FrameEventManagerService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: ContextTableConfig,
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
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this.compareFilter, order: this._order, pager: this._pager };
        
        return this._reportService.getReport(compareReportConfig, this._dataConfig)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          this._totalCount = 0;
          
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
      this._totalCount = current.table.totalCount;
      this._tableData = tableData.map(fixContextTableName);
    }
  }
  
  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData.map(fixContextTableName);
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
  
  public _showOverlay(event: MouseEvent, contextId: string): void {
    const id = parseInt(contextId, 10);
    if (this._overlay && id && !isNaN(id)) {
      this._contextId = id;
      this._overlay.show(event);
    }
  }
  
  public _hideOverlay(): void {
    if (this._overlay) {
      this._contextId = null;
      this._overlay.hide();
    }
  }
}
