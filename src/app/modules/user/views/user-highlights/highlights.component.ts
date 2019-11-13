import { Component, Input, OnDestroy } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaEntryStatus, KalturaFilterPager, KalturaObjectBaseFactory, KalturaPager, KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, NavigationDrillDownService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf, Subject } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { HighlightsConfig } from './highlights.config';
import { SortEvent } from 'primeng/api';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { UserBase } from '../user-base/user-base';
import { HeatMapStoreService } from 'shared/components/heat-map/heat-map-store.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-user-highlights',
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss'],
  providers: [
    KalturaLogger.createLogger('HighlightsComponent'),
    HighlightsConfig,
    ReportService,
    HeatMapStoreService,
  ],
})
export class UserHighlightsComponent extends UserBase implements OnDestroy {
  @Input() userId: string;
  @Input() dateFilterComponent: DateFilterComponent;
  
  public _entryDetails: TableRow[] = [];
  private _updateTableHeight = new Subject<void>();
  private _order = '-count_loads';
  private _reportType = reportTypeMap(KalturaReportType.topUserContent);
  private _dataConfig: ReportDataConfig;
  private _partnerId = this._authService.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  
  protected _componentId = 'highlights';
  
  public _updateTableHeight$ = this._updateTableHeight.asObservable();
  
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
  public _lineChartData = {};
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
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: HighlightsConfig,
              private _logger: KalturaLogger,
              private _navigationDrillDownService: NavigationDrillDownService) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  ngOnDestroy() {
    this._updateTableHeight.complete();
  }
  
  private _loadTableData(isCompare = false): void {
    let reportConfig: ReportConfig;
    if (isCompare) {
      this._compareFilter.userIds = this.userId;
      reportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order, pager: this._comparePager };
      this._compareTableBusy = true;
      this._compareTableBlockerMessage = null;
    } else {
      this._filter.userIds = this.userId;
      reportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
      this._currentTableBusy = true;
      this._currentTableBlockerMessage = null;
    }
    
    const getTableData = (report, pager) => {
      if (report.table && report.table.data && report.table.header) {
        const { tableData } = this._reportService.parseTableData(report.table, this._dataConfig.table);
        const totalCount = report.table.totalCount;
        const { tableData: entryDetails } = this._reportService.parseTableData(report.table, this._dataConfig.entryDetails);
        
        return {
          totalCount,
          tableData: tableData.map((item, index) => this._extendTableRow(item, index, pager)),
          entryDetails: entryDetails.map((item, index) => this._extendTableRow(item, index, pager))
        };
      }
      
      return {
        totalCount: 0,
        tableData: [],
      };
    };
    
    this._reportService.getReport(reportConfig, { table: this._dataConfig.table }, false)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        report => {
          if (isCompare) {
            const compare = getTableData(report, this._comparePager);
            this._compareTotalCount = compare.totalCount;
            this._compareTableData = compare.tableData;
            this._compareTableBusy = false;
            this._entryDetails = [...this._entryDetails, compare.entryDetails];
          } else {
            const current = getTableData(report, this._pager);
            this._totalCount = current.totalCount;
            this._tableData = current.tableData;
            this._entryDetails = current.entryDetails;
            this._currentTableBusy = false;
          }
          this._updateTableHeight.next();
        },
        error => {
          const actions = {
            'close': () => {
              if (isCompare) {
                this._compareTableBlockerMessage = null;
              } else {
                this._currentTableBlockerMessage = null;
              }
              
            },
            'retry': () => {
              this._loadTableData(isCompare);
            },
          };
          const message = this._errorsManager.getErrorMessage(error, actions);
          if (isCompare) {
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
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    this._filter.userIds = this.userId;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        this._compareFilter.userIds = this.userId;
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order, pager: this._pager };
        
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._totalCount = 0;
          this._tableData = [];
          
          if (report.totals && report.totals.data) {
            this._handleTotals(report.totals); // handle totals
          }
          
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            this._currentDates = null;
            this._compareDates = null;
            
            if (report.table && report.table.data && report.table.header) {
              this._handleTable(report.table); // handle table
            }
            if (report.graphs.length) {
              this._handleGraphs(report.graphs); // handle graphs
            }
          }
          this._compareFirstTimeLoading = false;
          this._firstTimeLoading = false;
          this._isBusy = false;
          this._updateTableHeight.next();
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
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    this._comparePager.pageIndex = 1;
    
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
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
    
    if (current.table && current.table.data && compare.table) {
      this._handleTable(current.table, compare);
    }
    
    if (current.totals && compare.totals) {
      this._tabsData = this._compareService.compareTotalsData(
        currentPeriod,
        comparePeriod,
        current.totals,
        compare.totals,
        this._dataConfig.totals,
        this._selectedMetrics,
      );
    }
  }
  
  private _extendTableRow(item: TableRow<string>, index: number, pager: KalturaPager): TableRow<string> {
    item['index'] = String(pager.pageSize * (pager.pageIndex - 1) + (index + 1));
    item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/256/height/144?rnd=${Math.random()}`;
    return item;
  }
  
  private _handleTable(table: KalturaReportTable, compare?: Report): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData.map((item, index) => this._extendTableRow(item, index, this._pager));
    
    const { tableData: entryDetails } = this._reportService.parseTableData(table, this._dataConfig.entryDetails);
    this._entryDetails = entryDetails.map((item, index) => this._extendTableRow(item, index, this._pager));
    
    if (compare && compare.table && compare.table.header && compare.table.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compare.table, this._dataConfig.table);
      this._compareTotalCount = compare.table.totalCount;
      this._compareTableData = compareTableData.map((item, index) => this._extendTableRow(item, index, this._comparePager));
      this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM D, YYYY');
      this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM D, YYYY');
      
      const { tableData: compareEntryDetails } = this._reportService.parseTableData(compare.table, this._dataConfig.entryDetails);
      this._entryDetails = [...this._entryDetails, ...compareEntryDetails.map((item, index) => this._extendTableRow(item, index, this._pager))];
    }
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
  
  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
  }
  
  public _onPaginationChanged(isCompareTable: boolean, pager: KalturaPager, event: { page: number, pageCount: number, rows: TableRow<string>, first: number }): void {
    if (event.page !== (pager.pageIndex - 1)) {
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      pager.pageIndex = event.page + 1;
      this._loadTableData(isCompareTable);
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
    const { object_id: entryId, status, partner_id: partnerId } = row;
    if (status === '') {
      this._navigationDrillDownService.drilldown('entry', entryId, true, partnerId);
    }
  }
}
