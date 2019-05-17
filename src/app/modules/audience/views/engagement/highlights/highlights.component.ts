import { Component, Input, OnDestroy } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { HighlightsConfig } from './highlights.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import { SortEvent } from 'primeng/api';
import { tableLocalSortHandler, TableRow } from 'shared/utils/table-local-sort-handler';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';

@Component({
  selector: 'app-engagement-highlights',
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss'],
  providers: [
    KalturaLogger.createLogger('EngagementHighlightsComponent'),
    HighlightsConfig,
    ReportService
  ],
})
export class EngagementHighlightsComponent extends EngagementBaseReportComponent implements OnDestroy {
  @Input() dateFilterComponent: DateFilterComponent;
  
  private _order = '-date_id';
  private _reportType = KalturaReportType.userEngagementTimeline;
  private _dataConfig: ReportDataConfig;
  
  protected _componentId = 'highlights';
  
  public highlights$ = new BehaviorSubject<{ current: Report, compare: Report, busy: boolean, error: KalturaAPIException }>({ current: null, compare: null, busy: false, error: null });
  
  public _tableMode = TableModes.dates;
  public _columns: string[] = [];
  public _firstTimeLoading = true;
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _tableData: TableRow[] = [];
  public _selectedMetrics: string;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _lineChartData = {};
  public _showTable = false;
  public _totalCount = 0;
  public _pageSize = analyticsConfig.defaultPageSize;
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _tableModes = [
    { label: this._translate.instant('app.engagement.dimensions.dates'), value: TableModes.dates },
    { label: this._translate.instant('app.engagement.dimensions.users'), value: TableModes.users },
    { label: this._translate.instant('app.engagement.dimensions.entries'), value: TableModes.entries },
  ];
  
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
              private _logger: KalturaLogger) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  ngOnDestroy() {
    this.highlights$.complete();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this.highlights$.next({ current: null, compare: null, busy: true, error: null });
    this._isBusy = true;
    this._blockerMessage = null;
  
    sections = { ...sections }; // make local copy
    // delete sections[ReportDataSection.table]; // remove table config to prevent table request
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };

        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
    
          this.highlights$.next({ current: report, compare: compare, busy: false, error: null });
    
          if (report.totals && !this._tabsData.length) {
            this._handleTotals(report.totals); // handle totals
          }

          if (compare) {
            this._handleCompare(report, compare);
          } else {
            if (report.graphs.length) {
              this._handleTable(report.graphs); // handle table
              this._handleGraphs(report.graphs); // handle graphs
            }
          }
          this._firstTimeLoading = false;
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
          this.highlights$.next({ current: null, compare: null, busy: false, error: error });
        });
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._order = this._reportInterval === KalturaReportInterval.days ? '-date_id' : '-month_id';
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
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };

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
  
      const compareTableData = this._compareService.compareTableFromGraph(
        currentPeriod,
        comparePeriod,
        current.graphs,
        compare.graphs,
        this._dataConfig.table,
        this._reportInterval,
      );
  
      if (compareTableData) {
        const { columns, tableData, totalCount } = compareTableData;
        this._totalCount = totalCount;
        this._columns = columns;
        this._tableData = tableData;
      }
    }
  }
  
  private _handleTable(graphs: KalturaReportGraph[]): void {
    const { columns, tableData, totalCount } = this._reportService.tableFromGraph(
      graphs,
      this._dataConfig.table,
      this._reportInterval,
    );
    this._totalCount = totalCount;
    this._columns = columns;
    this._tableData = tableData;
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
  
  public _toggleTable(): void {
    this._logger.trace('Handle toggle table visibility action by user', { tableVisible: !this._showTable });
    this._showTable = !this._showTable;
    
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        const height = document.getElementById('analyticsApp').getBoundingClientRect().height;
        this._logger.trace('Send update layout event to the host app', { height });
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height });
      }, 0);
    }
  }
  
  public _onSortChanged(event: SortEvent) {
    this._logger.trace('Handle local sort changed action by user', { field: event.field, order: event.order });
    this._order = tableLocalSortHandler(event, this._order, this._isCompareMode);
  }
  
  public _onTableModeChange(mode: TableModes): void {
    this._tableMode = mode;
    
  }
}
