import {Component, Input, OnInit} from '@angular/core';
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
import { ViewerEngagementConfig } from './viewer-engagement.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { analyticsConfig } from 'configuration/analytics-config';
import { HeatMapStoreService } from 'shared/components/heat-map/heat-map-store.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { SortEvent } from 'primeng/api';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-ep-viewer-engagement',
  templateUrl: './viewer-engagement.component.html',
  styleUrls: ['./viewer-engagement.component.scss'],
  providers: [
    HeatMapStoreService,
    ViewerEngagementConfig,
    ReportService
  ]
})
export class EpViewerEngagementComponent implements OnInit {
  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() endDate: Date;

  private _order = '-live_view_time';
  public _sortField = 'live_view_time';
  private _reportType = reportTypeMap(KalturaReportType.epWebcastLiveUserEngagement);
  private _dataConfig: ReportDataConfig;
  private _ignoreFirstSortEvent = true;
  public _exporting = false;

  public _columns: string[] = [];
  public _totalCount = 0;
  public _tableData: any[] = [];
  public _firstTimeLoading = true;
  public _selectedMetrics: string;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _pager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  constructor(private _frameEventManager: FrameEventManagerService,
              private _heatMapStore: HeatMapStoreService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: ViewerEngagementConfig,
              private _authService: AuthService,
              private _navigationDrillDownService: NavigationDrillDownService) {

    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
    this._loadReport();
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;

    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null })
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

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    // calculate Live minutes ratio
    // this._tabsData[4].value = (parseFloat(this._tabsData[4].rawValue.toString()) / parseFloat(this._tabsData[3].rawValue.toString()) * 100).toFixed(2);
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData;
  }

  public _onPaginationChanged(event: any): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._loadReport({ table: this._dataConfig[ReportDataSection.table] });
    }
  }

  public _onSortChanged(event: SortEvent): void {
    if (event.field && event.order && !this._ignoreFirstSortEvent) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._sortField = event.field;
        this._pager.pageIndex = 1;
        this._loadReport({ table: this._dataConfig[ReportDataSection.table] });
      }
    }
    this._ignoreFirstSortEvent = false;
  }

  public _drillDown(row: TableRow): void {
    if (!row['user_id'] || row['user_id'] === 'Unknown' || row['user_id'] === 'Error') {
      return; // ignore unknown user drill-down
    }
    this._navigationDrillDownService.drilldown('user', row['user_id'], true, this._authService.pid);
  }

  public _export(): void {
    // Export report
  }
}
