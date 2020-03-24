import { Component, Input, OnDestroy } from '@angular/core';
import {
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaObjectBaseFactory,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportType
} from 'kaltura-ngx-client';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { BrowserService, ErrorsManagerService, NavigationDrillDownService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { map, switchMap } from 'rxjs/operators';
import { SortEvent } from 'primeng/api';
import { SubcategoriesConfig } from './subcategories.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { ViewConfig } from "configuration/view-config";
import {CategoryBase} from "../category-base/category-base";

@Component({
  selector: 'app-subcategories',
  templateUrl: './subcategories.component.html',
  styleUrls: ['./subcategories.component.scss'],
  providers: [SubcategoriesConfig],
})
export class SubcategoriesComponent extends CategoryBase implements OnDestroy {
  @Input() categoryId: string = null;
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _firstTimeLoading = true;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _reportInterval = KalturaReportInterval.days
  private _reportType = reportTypeMap(KalturaReportType.subCategories);
  private _dataConfig: ReportDataConfig;
  private _order = '-count_plays';
  
  protected _componentId = 'subcategories';
  
  public totalCount = 0;
  
  public _tableData: TableRow[] = [];
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: analyticsConfig.defaultPageSize });
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage = null;
  public _viewConfig: ViewConfig =  analyticsConfig.viewsConfig.category;
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _reportService: ReportService,
              private _compareService: CompareService,
              private _browserService: BrowserService,
              private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _frameEventManager: FrameEventManagerService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: SubcategoriesConfig,
              private _navigationDrillDownService: NavigationDrillDownService) {
    super();
    this._dataConfig = this._dataConfigService.getConfig();
  }
  
  ngOnDestroy(): void {
  }
  
  protected _loadReport(): void {
    this._isBusy = true;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    if (this.categoryId) {
      this._filter.categoriesAncestorIdIn = this.categoryId;
    }
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order, pager: this._pager };
        if (this.categoryId) {
          this._compareFilter.categoriesAncestorIdIn = this.categoryId;
        }
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
          this._firstTimeLoading = false;
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
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
    
    if (current.table && compare.table) {
      const { columns, tableData } = this._compareService.compareTableData(
        currentPeriod,
        comparePeriod,
        current.table,
        compare.table,
        this._dataConfig.table,
        this._reportInterval,
        'object_id',
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
    if (event.data.length && event.field && event.order && !this._isCompareMode) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._loadReport();
      }
    }
  }
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }
  
  protected _updateRefineFilter(): void {
    const userIds = this._filter.userIds;
    
    this._refineFilterToServerValue(this._filter);
    
    if (userIds) {
      this._filter.userIds = userIds;
    }
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
      
      if (userIds) {
        this._compareFilter.userIds = userIds;
      }
    }
  }
  
}


