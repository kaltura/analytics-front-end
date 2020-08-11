import { Component, Input, OnDestroy } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, of as ObservableOf, Subject } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { HighlightsConfig } from './highlights.config';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { reportTypeMap } from 'shared/utils/report-type-map';
import {ViewConfig} from "configuration/view-config";

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
  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = {
      };
    }
  }

  private _order = '-date_id';
  private _reportType = reportTypeMap(KalturaReportType.userEngagementTimeline);
  private _dataConfig: ReportDataConfig;
  private _filterChange = new Subject();

  protected _componentId = 'highlights';

  public highlights$ = new BehaviorSubject<{ current: Report, compare: Report, busy: boolean, error: KalturaAPIException }>({ current: null, compare: null, busy: false, error: null });

  public _tableModes = TableModes;
  public _tableMode = TableModes.dates;
  public _columns: string[] = [];
  public _firstTimeLoading = true;
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isMultiAccount = false;
  public _tabsData: Tab[] = [];
  public _tableData: TableRow[] = [];
  public _selectedMetrics: string;
  public _reportInterval = KalturaReportInterval.days;
  public _sortField = 'date_id';
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _lineChartData = {};
  public _showTable = false;
  public _totalCount = 0;
  public _pageSize = analyticsConfig.defaultPageSize;
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });
  public _datesTableData: { current: Report, compare?: Report } = { current: null };
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _tableModesOptions = [
    { label: this._translate.instant('app.engagement.dimensions.dates'), value: TableModes.dates },
    { label: this._translate.instant('app.engagement.dimensions.users'), value: TableModes.users },
    { label: this._translate.instant('app.engagement.dimensions.entries'), value: TableModes.entries },
    { label: this._translate.instant('app.engagement.dimensions.context'), value: TableModes.context },
  ];
  public _currentPeriod: { from: number, to: number };
  public _comparePeriod: { from: number, to: number };
  public _filterChange$ = this._filterChange.asObservable();
  public _viewConfig: ViewConfig = {
    userFilter: {},
  };
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

    this._isMultiAccount = analyticsConfig.multiAccount;
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnDestroy() {
    this._filterChange.complete();
    this.highlights$.complete();
  }

  protected _loadReport(sections = this._dataConfig): void {
    this.highlights$.next({ current: null, compare: null, busy: true, error: null });
    this._isBusy = true;
    this._blockerMessage = null;

    sections = { ...sections }; // make local copy
    delete sections[ReportDataSection.table]; // remove table config to prevent table request

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };

        return this._reportService.getReport(compareReportConfig, sections, false)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];

          this.highlights$.next({ current: report, compare: compare, busy: false, error: null });

          if (report.totals && !this._tabsData.length) {
            this._handleTotals(report.totals); // handle totals
          }

          if (compare) {
            this._datesTableData = { current: report, compare: compare };
            this._handleCompare(report, compare);
          } else {
            if (report.graphs.length) {
              this._handleGraphs(report.graphs); // handle graphs

              this._datesTableData = { current: report };
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
    this._sortField = this._reportInterval === KalturaReportInterval.days ? 'date_id' : 'month_id';
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

    this._filterChange.next();
  }

  private _handleCompare(current: Report, compare: Report): void {
    this._currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    this._comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };

    if (current.graphs.length && compare.graphs.length) {
      const { lineChartData } = this._compareService.compareGraphData(
        this._currentPeriod,
        this._comparePeriod,
        current.graphs,
        compare.graphs,
        this._dataConfig.graph,
        this._reportInterval,
      );
      this._lineChartData = !isEmptyObject(lineChartData) ? lineChartData : null;
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

  public _onRefineFilterChange(event: RefineFilter): void {
    const userIds = event.length
      ? event
        .filter(filter => filter.type === 'users')
        .map(filter => filter.value.id === '0' ? 'Unknown' : filter.value.id) // replace id=0 with Unknown due to the server limitation
        .join(analyticsConfig.valueSeparator)
      : null;
    const entriesIds = event.length
      ? event
        .filter(filter => filter.type === 'entries')
        .map(filter => filter.value.id)
        .join(analyticsConfig.valueSeparator)
      : null;
    const contextIds = event.length
      ? event
        .filter(filter => filter.type === 'context')
        .map(filter => filter.value.id)
        .join(analyticsConfig.valueSeparator)
      : null;

    if (userIds) {
      this._filter.userIds = userIds;

      if (this._compareFilter) {
        this._compareFilter.userIds = userIds;
      }
    } else {
      delete this._filter.userIds;

      if (this._compareFilter) {
        delete this._compareFilter.userIds;
      }
    }

    if (entriesIds) {
      this._filter.entryIdIn = entriesIds;

      if (this._compareFilter) {
        this._compareFilter.entryIdIn = entriesIds;
      }
    } else {
      delete this._filter.entryIdIn;

      if (this._compareFilter) {
        delete this._compareFilter.entryIdIn;
      }
    }

    if (contextIds) {
      this._filter.playbackContextIdsIn = contextIds;

      if (this._compareFilter) {
        this._compareFilter.playbackContextIdsIn = contextIds;
      }
    } else {
      delete this._filter.playbackContextIdsIn;

      if (this._compareFilter) {
        delete this._compareFilter.playbackContextIdsIn;
      }
    }

    this._filterChange.next();
  }

  public _onChangeMode(): void {
    this._firstTimeLoading = true;

    // clean up users and entries filters
    delete this._filter.userIds;
    delete this._filter.entryIdIn;

    if (this._compareFilter) {
      delete this._compareFilter.userIds;
      delete this._compareFilter.entryIdIn;
    }
  }
}
