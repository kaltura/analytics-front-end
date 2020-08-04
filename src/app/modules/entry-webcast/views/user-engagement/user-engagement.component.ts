import { Component, Input } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import {
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaObjectBaseFactory,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportTotal,
  KalturaReportType
} from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {
  AuthService,
  ErrorsManagerService,
  NavigationDrillDownService,
  Report,
  ReportConfig,
  ReportService
} from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { UserEngagementConfig } from './user-engagement.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { analyticsConfig } from 'configuration/analytics-config';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { ViewConfig } from 'configuration/view-config';
import { HeatMapStoreService } from 'shared/components/heat-map/heat-map-store.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { SortEvent } from 'primeng/api';
import { WebcastBaseReportComponent } from "../webcast-base-report/webcast-base-report.component";

@Component({
  selector: 'app-webcast-user-engagement',
  templateUrl: './user-engagement.component.html',
  styleUrls: ['./user-engagement.component.scss'],
  providers: [
    HeatMapStoreService,
    UserEngagementConfig,
    ReportService
  ]
})
export class WebcastEntryUserEngagementComponent extends WebcastBaseReportComponent {
  @Input() entryId = '';

  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = {
        userFilter: {},
      };
    }
  }

  private _order = '-count_plays';
  private _reportType = reportTypeMap(KalturaReportType.topUsersWebcast);
  private _dataConfig: ReportDataConfig;
  private _ignoreFirstSortEvent = true;

  public _dateFilter: DateChangeEvent;
  protected _componentId = 'user-engagement';

  public _viewConfig: ViewConfig = {
    userFilter: {},
  };
  public _selectedRefineFilters: RefineFilter = null;
  public _columns: string[] = [];
  public _totalCount = 0;
  public _tableData: any[] = [];
  public _firstTimeLoading = true;
  public _lineChartData: { [key: string]: any } = {};
  public _selectedMetrics: string;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _showTable = false;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _heatMapStore: HeatMapStoreService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserEngagementConfig,
              private _authService: AuthService,
              private _navigationDrillDownService: NavigationDrillDownService) {
    super();

    this._dataConfig = _dataConfigService.getConfig();
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    if (this.entryId) {
      this._filter.entryIdIn = this.entryId;
    }
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        if (this.entryId) {
          this._compareFilter.entryIdIn = this.entryId;
        }
        const compareReportConfig: ReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._tableData = [];
          this._totalCount = 0;
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle totals
          }

          this._isBusy = false;
          this._firstTimeLoading = false;
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
    this._heatMapStore.clearCache();
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }

  protected _updateFilter(): void {
    this._heatMapStore.clearCache();
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    // calculate Live minutes ratio
    this._tabsData[4].value = (parseFloat(this._tabsData[4].rawValue.toString()) / parseFloat(this._tabsData[3].rawValue.toString()) * 100).toFixed(2);
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData;
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
        'name'
      );
      this._totalCount = current.table.totalCount;
      this._columns = columns;
      this._tableData = tableData;
    }
  }

  public _toggleTable(): void {
    if (this._isBusy) {
      return;
    }

    this._showTable = !this._showTable;

    if (!this._showTable) {
      this._ignoreFirstSortEvent = true;
    }

    setTimeout(() => {
      this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
    }, 0);
  }

  public _onPaginationChanged(event: any): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._loadReport({ table: this._dataConfig[ReportDataSection.table] });
    }
  }

  public _onSortChanged(event: SortEvent): void {
    if (event.field && event.order && !this._isCompareMode && !this._ignoreFirstSortEvent) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._pager.pageIndex = 1;
        this._loadReport({ table: this._dataConfig[ReportDataSection.table] });
      }
    }
    this._ignoreFirstSortEvent = false;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    const userIds = event.length
      ? event
        .map(filter => filter.value.id === '0' ? 'Unknown' : filter.value.id) // replace id=0 with Unknown due to the server limitation
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

    this._loadReport();
  }

  public _drillDown(row: TableRow): void {
    if (!row['user_id'] || row['user_id'] === 'Unknown' || row['user_id'] === 'Error') {
      return; // ignore unknown user drill-down
    }
    this._navigationDrillDownService.drilldown('user', row['user_id'], true, this._authService.pid);
  }
}
