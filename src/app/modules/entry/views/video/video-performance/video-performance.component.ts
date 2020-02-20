import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf, Subject } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { VideoPerformanceConfig } from './video-performance.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { EntryBase } from '../../shared/entry-base/entry-base';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { SelectItem, SortEvent } from 'primeng/api';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { tableLocalSortHandler, TableRow } from 'shared/utils/table-local-sort-handler';
import { analyticsConfig } from 'configuration/analytics-config';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { NgxEchartsDirective } from 'shared/ngx-echarts/ngx-echarts.directive';

@Component({
  selector: 'app-video-entry-performance',
  templateUrl: './video-performance.component.html',
  styleUrls: ['./video-performance.component.scss'],
  providers: [VideoPerformanceConfig, ReportService]
})
export class VideoEntryPerformanceComponent extends EntryBase implements OnDestroy {
  @Input() entryId = '';
  @Input() showTitle = true;
  @Input() dateFilterComponent: DateFilterComponent;

  private _order = '-date_id';
  private _reportType = KalturaReportType.userTopContent;
  private _dataConfig: ReportDataConfig;
  private _rawGraphData: KalturaReportGraph[] = [];
  private _ignoreFirstSortEvent = false;
  private _filterChange = new Subject();

  public TableMode = TableModes;
  public _metricsCompareTo: string = null;

  public _dateFilter: DateChangeEvent;
  protected _componentId = 'video-performance';

  public _filterChange$ = this._filterChange.asObservable();
  public _tableMode = TableModes.dates;
  public _columns: string[] = [];
  public _usersColumns: string[] = [];
  public _datesColumns: string[] = [];
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  public _usersTableData: TableRow<string>[] = null;
  public _datesTableData: TableRow<string>[] = null;
  public _firstTimeLoading = true;
  public _lineChartData: { [key: string]: any } = {};
  public _metricsLineChartData: { [key: string]: any } = null;
  public _selectedMetrics: string;
  public _selectedMetricsLabel: string;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _metricsOptions: SelectItem[] = [];
  public _metricsColors: { [key: string]: string; } = {};
  public _showTable = false;
  public _customPaginator = false;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pageSize = analyticsConfig.defaultPageSize;
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _tableModes = [
    { label: this._translate.instant('app.entry.dates'), value: TableModes.dates },
    { label: this._translate.instant('app.entry.users'), value: TableModes.users },
    { label: this._translate.instant('app.entry.context'), value: TableModes.context },
  ];

  public _currentDatePeriod = '';
  public _compareDatePeriod = '';

  @ViewChild(NgxEchartsDirective, { static: false }) _chart: NgxEchartsDirective;

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: VideoPerformanceConfig,
              private _browserService: BrowserService) {
    super();

    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
    this._selectedMetricsLabel = this._translate.instant(`app.entry.${this._selectedMetrics}`);

    const totalsConfig = this._dataConfig[ReportDataSection.totals].fields;
    const graphConfig = this._dataConfig[ReportDataSection.graph].fields;
    Object.keys(totalsConfig).forEach(field => {
      this._metricsOptions.push({
        label: this._translate.instant(`app.entry.${field}`),
        value: field
      });

      this._metricsColors[field] = graphConfig[field].colors ? graphConfig[field].colors[0] : null;
    });

    this._browserService.contrastThemeChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(isContrast => this._toggleChartTheme(isContrast));
  }

  ngOnDestroy(): void {
    this._filterChange.complete();
  }

  private _toggleChartTheme(isContrast: boolean): void {
    if (this._chart && this._chart.options) {
      const color = isContrast ? '#333333' : '#999999';
      this._chart.options.tooltip.textStyle.color = color;
      this._chart.options.xAxis.axisLabel.color = color;
      this._chart.options.yAxis.axisLabel.color = color;
      this._chart.setOption(this._chart.options);
    }
  }

  private _updateTableData(): void {
    const tableData = this._tableMode === TableModes.dates ? this._datesTableData : this._usersTableData;
    const columns = this._tableMode === TableModes.dates ? this._datesColumns : this._usersColumns;
  
    if (tableData === null) {
      if (this._tableMode === TableModes.dates && !this._isCompareMode && this._rawGraphData.length) {
        this._handleDatesTable(this._rawGraphData);
      } else {
        let sections: ReportDataConfig = { table: this._dataConfig[ReportDataSection.table] };
        if (this._isCompareMode || !this._rawGraphData.length) {
          sections = { ...sections, graph: this._dataConfig[ReportDataSection.graph] };
        }
        this._loadReport(sections);
      }
    } else {
      this._tableData = tableData;
      this._columns = columns;
    }
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    if (reportConfig['objectIds__null']) {
      delete reportConfig['objectIds__null'];
    }
    reportConfig.objectIds = this.entryId;

    sections = { ...sections }; // make local copy

    if (this._tableMode === TableModes.dates) {
      delete sections[ReportDataSection.table]; // remove table config to prevent table request
    } else if (this._tableMode === TableModes.users) {
      reportConfig.pager = this._pager;
    }

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig: ReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };
        if (compareReportConfig['objectIds__null']) {
          delete compareReportConfig['objectIds__null'];
        }
        compareReportConfig.objectIds = this.entryId;

        if (this._tableMode === TableModes.users) {
          compareReportConfig.pager = this._pager;
        }

        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            if (report.graphs && report.graphs.length) {
              this._rawGraphData = report.graphs;
            }

            this._handleGraphs(this._rawGraphData);

            if (this._tableMode === TableModes.dates) {
              this._handleDatesTable(this._rawGraphData); // handle table
            }

            if (report.table && report.table.data && report.table.header) {
              if (this._tableMode === TableModes.users) {
                this._handleUsersTable(report.table); // handle table
              }
            }
            if (report.totals) {
              this._handleTotals(report.totals); // handle totals
            }
          }
          setTimeout(() => {
            this._isBusy = false;
            this._firstTimeLoading = false;
          });
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

  protected _updateRefineFilter(): void {
    this._datesTableData = null;
    this._usersTableData = null;
    this._rawGraphData = [];
    this._pager.pageIndex = 1;

    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
    this._filterChange.next();
  }

  protected _updateFilter(): void {
    this._datesTableData = null;
    this._usersTableData = null;
    this._rawGraphData = [];
    this._pager.pageIndex = 1;

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
    this._filterChange.next();
  }

  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };

    if (current.totals) {
      this._handleTotals(current.totals); // handle totals
    }

    if (current.graphs.length && compare.graphs.length) {
      const { lineChartData } = this._compareService.compareGraphData(
        currentPeriod,
        comparePeriod,
        current.graphs,
        compare.graphs,
        this._dataConfig.graph,
        this._reportInterval,
      );
      this._lineChartData = lineChartData;

      if (this._metricsCompareTo) {
        this._onCompareTo(this._metricsCompareTo);
      }
    }

    if (this._tableMode === TableModes.dates) {
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
        this._datesColumns = columns;
        this._datesTableData = tableData;
        this._columns = [...this._datesColumns];
        this._tableData = [...this._datesTableData];
      }
    } else {
      if (current.table && compare.table) {
        const { columns, tableData } = this._compareService.compareTableData(
          currentPeriod,
          comparePeriod,
          current.table,
          compare.table,
          this._dataConfig.table,
          this._reportInterval,
          'name'
        );
        this._usersColumns = columns;
        this._totalCount = compare.table.totalCount;
        this._usersTableData = tableData;
        this._columns = [...this._usersColumns];
        this._tableData = [...this._usersTableData];
      }
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
      this._reportInterval
    );
    this._lineChartData = lineChartData;
    if (this._metricsCompareTo) {
      this._onCompareTo(this._metricsCompareTo);
    }
  }

  private _handleDatesTable(graphs: KalturaReportGraph[]): void {
    const { columns, tableData, totalCount } = this._reportService.tableFromGraph(
      graphs,
      this._dataConfig.table,
      this._reportInterval,
    );
    this._totalCount = totalCount;
    this._datesColumns = columns;
    this._datesTableData = tableData;
    this._columns = [...this._datesColumns];
    this._tableData = [...this._datesTableData];
  }

  private _handleUsersTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._usersColumns = columns;
    this._usersTableData = tableData;
    this._columns = [...this._usersColumns];
    this._tableData = [...this._usersTableData];
  }

  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
    this._selectedMetricsLabel = this._translate.instant(`app.entry.${this._selectedMetrics}`);
    this._metricsLineChartData = null;
  }

  public _toggleTable(): void {
    this._ignoreFirstSortEvent = true;
    this._showTable = !this._showTable;
    this.updateLayout();
  }

  public _onSortChanged(event: SortEvent): void {
    this._pager.pageIndex = 1;

    if (this._tableMode === TableModes.dates) {
      this._order = tableLocalSortHandler(event, this._order, this._isCompareMode);
    } else if (event.data.length && event.field && event.order && !this._isCompareMode) {
      // prevent handling first sort event after mode switching to users to prevent redundant loadReport call
      // because event.field will be outdated at the time
      if (this._ignoreFirstSortEvent) {
        this._ignoreFirstSortEvent = false;
        return;
      }

      setTimeout(() => {
        const order = event.order === 1 ? '+' + event.field : '-' + event.field;
        if (order !== this._order) {
          this._order = order;
          this._loadReport({ table: this._dataConfig.table });
        }
      });
    }
  }

  public _onCompareTo(field: string): void {
    if (field) {
      this._metricsCompareTo = field;
      this._currentDatePeriod = this._compareFilter ? DateFilterUtils.getMomentDate(this._filter.fromDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._filter.toDate).format('MMM D, YYYY') : '';
      this._compareDatePeriod = this._compareFilter ? DateFilterUtils.getMomentDate(this._compareFilter.fromDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._compareFilter.toDate).format('MMM D, YYYY') : '';
      this._metricsLineChartData = this._compareService.compareToMetric(
        this._dataConfig.graph,
        this._lineChartData,
        this._selectedMetrics,
        field,
        this._selectedMetricsLabel,
        this._translate.instant(`app.entry.${field}`),
        this._currentDatePeriod,
        this._compareDatePeriod
      );
      // Normalize yAxis if metrics are comparable and max values of both y-axis are close enough
      const comparableUnitsMetrics = ['count_plays', 'count_loads', 'unique_known_users', 'sum_time_viewed'];
      const comparablePercentMetrics = ['avg_completion_rate', 'avg_view_drop_off'];
      const allowNormalize = (comparableUnitsMetrics.indexOf(field) > -1 && comparableUnitsMetrics.indexOf(this._selectedMetrics) > -1) ||
        (comparablePercentMetrics.indexOf(field) > -1 && comparablePercentMetrics.indexOf(this._selectedMetrics) > -1);
      if (allowNormalize && this._metricsLineChartData.yAxis && this._metricsLineChartData.yAxis.length === 2) {
        const max1 = this._metricsLineChartData.yAxis[0].max;
        const max2 = this._metricsLineChartData.yAxis[1].max;
        const maxValue = Math.max(max1, max2);
        if (maxValue && maxValue > 0 && maxValue / Math.min(max1, max2) < 10) {
          const interval = parseFloat((maxValue / 5).toFixed(2));
          this._metricsLineChartData.yAxis[0].min = 0;
          this._metricsLineChartData.yAxis[1].min = 0;
          this._metricsLineChartData.yAxis[0].max = maxValue;
          this._metricsLineChartData.yAxis[1].max = maxValue;
          this._metricsLineChartData.yAxis[0].interval = interval;
          this._metricsLineChartData.yAxis[1].interval = interval;
        }
      }
    } else {
      this._metricsLineChartData = null;
      this._metricsCompareTo = null;
    }
  }

  public _onPaginationChange(event: { page: number, first: number, rows: number, pageCount: number }): void {
    if (this._customPaginator && event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._loadReport({ table: this._dataConfig[ReportDataSection.table] });
    }

    this.updateLayout();
  }

  private updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
      }, 0);
    }
  }

  public _onTableModeChange(mode: TableModes): void {
    this._tableMode = mode;
    this._customPaginator = this._ignoreFirstSortEvent = this._tableMode === TableModes.users;
    this._order = this._tableMode === TableModes.users ? '-name' : '-date_id';
    this._updateTableData();
  }
}
