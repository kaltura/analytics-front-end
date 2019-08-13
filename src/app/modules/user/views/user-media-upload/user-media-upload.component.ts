import { Component, Input, OnDestroy } from '@angular/core';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { of as ObservableOf, Subject } from 'rxjs';
import { KalturaEndUserReportInputFilter, KalturaEntryStatus, KalturaFilterPager, KalturaObjectBaseFactory, KalturaPager, KalturaReportGraph, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { analyticsConfig } from 'configuration/analytics-config';
import { AuthService, BrowserService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { CompareService } from 'shared/services/compare.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { SortEvent } from 'primeng/api';
import { UserBase } from '../user-base/user-base';
import { UserMediaUploadConfig } from './user-media-upload.config';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-media-upload',
  templateUrl: './user-media-upload.component.html',
  styleUrls: ['./user-media-upload.component.scss'],
  providers: [
    ReportService,
    UserMediaUploadConfig
  ],
})
export class UserMediaUploadComponent extends UserBase implements OnDestroy {
  @Input() userId: string;
  @Input() dateFilterComponent: DateFilterComponent;
  
  private _updateTableHeight = new Subject<void>();
  private _order = '-created_at';
  private _reportType = reportTypeMap(KalturaReportType.topContentContributors);
  private _dataConfig: ReportDataConfig;
  private _partnerId = analyticsConfig.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  
  protected _componentId = 'user-media-upload';
  
  public _updateTableHeight$ = this._updateTableHeight.asObservable();
  
  public _entryDetails: TableRow[] = [];
  public _columns: string[] = [];
  public _firstTimeLoading = true;
  public _compareFirstTimeLoading = true;
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _tableData: TableRow[] = [];
  public _compareTableData: TableRow[] = [];
  public _selectedMetrics: string;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _lineChartData = null;
  public _showTable = false;
  public _totalCount = 0;
  public _compareTotalCount = 0;
  public _currentDates: string;
  public _compareDates: string;
  public _pager = new KalturaFilterPager({ pageSize: 5, pageIndex: 1 });
  public _comparePager = new KalturaFilterPager({ pageSize: 5, pageIndex: 1 });
  public _currentTableBusy = false;
  public _compareTableBusy = false;
  public _currentTableBlockerMessage: AreaBlockerMessage = null;
  public _compareTableBlockerMessage: AreaBlockerMessage = null;
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: UserMediaUploadConfig,
              private _logger: KalturaLogger,
              private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _browserService: BrowserService) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  ngOnDestroy() {
    this._updateTableHeight.complete();
  }
  
  private _loadTableData(): void {
    const reportType = reportTypeMap(KalturaReportType.topUserContent);
    const reportConfig = { reportType: reportType, filter: this._filter, order: this._order, pager: this._pager };
    
    this._filter.ownerIdsIn = this.userId;
    this._currentTableBusy = true;
    this._compareTableBusy = true;
    this._currentTableBlockerMessage = null;
    this._compareTableBlockerMessage = null;
    
    const getTableData = report => {
      if (report.table && report.table.data && report.table.header) {
        const { tableData, columns } = this._reportService.parseTableData(report.table, this._dataConfig.table);
        const totalCount = report.table.totalCount;
        const { tableData: entryDetails } = this._reportService.parseTableData(report.table, this._dataConfig.entryDetails);
        
        return {
          totalCount,
          columns,
          tableData: tableData.map(this._extendTableRow.bind(this)),
          entryDetails: entryDetails.map(this._extendTableRow.bind(this)),
        };
      }
      
      return {
        totalCount: 0,
        tableData: [],
      };
    };
    
    this._reportService.getReport(reportConfig, { table: this._dataConfig[ReportDataSection.table] }, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        this._compareFilter.ownerIdsIn = this.userId;
        const compareReportConfig = { reportType: reportType, filter: this._compareFilter, order: this._order, pager: this._pager };
        
        return this._reportService.getReport(compareReportConfig, { table: this._dataConfig[ReportDataSection.table] })
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(
        ({ report, compare }) => {
          if (report) {
            const current = getTableData(report);
            this._columns = current.columns;
            this._totalCount = current.totalCount;
            this._tableData = current.tableData;
            this._entryDetails = current.entryDetails;
            
            if (compare) {
              const compareData = getTableData(compare);
              this._compareTotalCount = compareData.totalCount;
              this._compareTableData = compareData.tableData;
              this._entryDetails = [...this._entryDetails, compareData.entryDetails];
            } else {
              this._compareTotalCount = 0;
              this._compareTableData = [];
            }
          } else {
            this._tableData = [];
            this._compareTableData = [];
            this._totalCount = 0;
            this._compareTotalCount = 0;
          }
          
          this._currentTableBusy = false;
          this._compareTableBusy = false;
          this._updateTableHeight.next();
          this._updateLayout();
        },
        error => {
          const actions = {
            'close': () => {
              if (this._isCompareMode) {
                this._compareTableBlockerMessage = null;
              } else {
                this._currentTableBlockerMessage = null;
              }
              
            },
            'retry': () => {
              this._loadTableData();
            },
          };
          const message = this._errorsManager.getErrorMessage(error, actions);
          if (this._isCompareMode) {
            this._compareTableBusy = false;
            this._compareTableBlockerMessage = message;
          } else {
            this._currentTableBusy = false;
            this._currentTableBlockerMessage = message;
          }
          this._updateTableHeight.next();
        }
      );
  }
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    this._filter.ownerIdsIn = this.userId;
    const sections = {
      totals: this._dataConfig[ReportDataSection.totals],
      graph: this._dataConfig[ReportDataSection.graph],
    };
  
    const filter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter, pager: null, order: null };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        this._compareFilter.ownerIdsIn = this.userId;
        const compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._compareFilter), this._filter);

        const compareReportConfig = { reportType: this._reportType, filter: compareFilter, pager: null, order: null };
        
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (report.totals && !this._tabsData.length) {
            this._handleTotals(report.totals); // handle totals
          }
          
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            this._currentDates = null;
            this._compareDates = null;
            
            if (report.graphs.length) {
              this._handleGraphs(report.graphs); // handle graphs
            }
          }
          this._compareFirstTimeLoading = false;
          this._firstTimeLoading = false;
          this._isBusy = false;
          
          if (this._showTable) {
            this._loadTableData();
          }
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
          this._updateTableHeight.next();
        });
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    this._comparePager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
      this._compareFirstTimeLoading = true;
    } else {
      this._compareFilter = null;
      this._compareFirstTimeLoading = true;
    }
    
    if (!this._showTable) {
      this._tableData = [];
    }
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._comparePager.pageIndex = 1;
    
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  
    if (!this._showTable) {
      this._tableData = [];
    }
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };
    
    this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM D, YYYY');
    this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM D, YYYY');
    
    if (current.graphs.length && compare.graphs.length) {
      const { lineChartData } = this._compareService.compareGraphData(
        currentPeriod,
        comparePeriod,
        current.graphs,
        compare.graphs,
        this._dataConfig.graph,
        this._reportInterval,
      );
      this._lineChartData = !isEmptyObject(lineChartData) ? lineChartData : null;
    }
  }
  
  private _extendTableRow(item: TableRow<string>): TableRow<string> {
    item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/256/height/144?rnd=${Math.random()}`;
    return item;
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }
  
  private _handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this._filter.fromDate, to: this._filter.toDate },
      this._reportInterval,
    );
    
    this._lineChartData = !isEmptyObject(lineChartData) ? lineChartData : null;
  }
  
  private _updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        const height = document.getElementById('analyticsApp').getBoundingClientRect().height;
        this._logger.trace('Send update layout event to the host app', { height });
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height });
      }, 0);
    }
  }
  
  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
  }
  
  public _toggleTable(): void {
    this._logger.trace('Handle toggle table visibility action by user', { tableVisible: !this._showTable });
    this._showTable = !this._showTable;
    this._updateTableHeight.next();
    this._updateLayout();
    
    if (this._showTable && !this._tableData.length) {
      this._loadTableData();
    }
  }
  
  public _onPaginationChanged(pager: KalturaPager, event: { page: number, pageCount: number, rows: TableRow<string>, first: number }): void {
    if (event.page !== (pager.pageIndex - 1)) {
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      pager.pageIndex = event.page + 1;
      this._loadTableData();
    }
  }
  
  public _onSortChanged(event: SortEvent): void {
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._logger.trace('Handle sort changed action by user, reset page index to 1', { order });
        this._order = order;
        this._pager.pageIndex = 1;
        this._loadTableData();
      }
    }
  }
  
  public _drillDown(row: TableRow<string>): void {
    const { object_id: entryId, status } = row;
    
    if (status === KalturaEntryStatus.ready) {
      if (analyticsConfig.isHosted) {
        const params = this._browserService.getCurrentQueryParams('string');
        this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/entry?id=${entryId}&${params}`);
      } else {
        this._router.navigate(['entry', entryId], { queryParams: this._activatedRoute.snapshot.queryParams });
      }
    }
  }
}
