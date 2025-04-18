import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import {KalturaClient, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType, KalturaUserFilter, UserListAction} from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {AppAnalytics, AuthService, ButtonType, ErrorsManagerService, NavigationDrillDownService, ReportConfig, ReportService} from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { ViewerEngagementConfig } from './viewer-engagement.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { HeatMapStoreService } from 'shared/components/heat-map/heat-map-store.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { SortEvent } from 'primeng/api';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { ExportItem } from "shared/components/export-csv/export-config-base.service";
import { ExportConfig } from "./export.config";
import { analyticsConfig } from "configuration/analytics-config";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
  selector: 'app-ep-viewer-engagement',
  templateUrl: './viewer-engagement.component.html',
  styleUrls: ['./viewer-engagement.component.scss'],
  providers: [
    HeatMapStoreService,
    ViewerEngagementConfig,
    ReportService,
    ExportConfig
  ]
})
export class EpViewerEngagementComponent implements OnInit, OnDestroy {
  @ViewChild('overlay') _overlay: OverlayPanel;
  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() actualStartDate: Date; // session actual start date
  @Input() endDate: Date;
  @Input() duration = 0;
  @Input() isVirtualClassroom: boolean;

  private _order = '-live_view_time';
  public _sortField = 'live_view_time';
  private _reportType = reportTypeMap(KalturaReportType.epWebcastLiveUserEngagement);
  private _dataConfig: ReportDataConfig;
  public _exportConfig: ExportItem[] = [];
  public _exportDateFilter: DateChangeEvent = null;
  private _ignoreFirstSortEvent = true;
  public _showMaxUsersMessage = false;

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
  public _userData: any = null;

  public _peopleSearch = '';

  constructor(private _frameEventManager: FrameEventManagerService,
              private _reportService: ReportService,
              private _analytics: AppAnalytics,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              _dataConfigService: ViewerEngagementConfig,
              private _authService: AuthService,
              _exportConfigService: ExportConfig,
              private _navigationDrillDownService: NavigationDrillDownService) {

    this._dataConfig = _dataConfigService.getConfig();
    this._exportConfig = _exportConfigService.getConfig();
  }

  ngOnInit(): void {
    this._exportDateFilter = {
      startDate: Math.floor(this.startDate.getTime() / 1000),
      endDate: Math.floor(this.endDate.getTime() / 1000),
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      timeUnits: KalturaReportInterval.days,
      endDay: null,
      startDay: null,
      compare: null
    };
    this._loadReport();
  }

  public _loadReport(sections = this._dataConfig, userIds = ''): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._showMaxUsersMessage = false;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    if (userIds.length > 0) {
      this._filter.userIds = userIds;
      this._pager.pageIndex = 1;
      this._pager.pageSize = 50;
    } else {
      delete this._filter.userIds;
      this._pager.pageSize = 10;
    }
     if (analyticsConfig.customData && analyticsConfig.customData.eventId) {
       this._filter.virtualEventIdIn = analyticsConfig.customData.eventId;
     }

    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
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
      if (this.isVirtualClassroom) {
        this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'VC_session_paginate_users', null, 'VC_session_dashboard');
      } else {
        this._analytics.trackButtonClickEvent(ButtonType.Navigate, 'Events_session_paginate_users');
      }

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
        const trackEventValues = {
          'live_view_time': 'minutes',
          'count_reaction_clicked': 'reactions',
          'count_raise_hand_clicked': 'raised',
          'combined_live_engaged_users_play_time_ratio': 'engagement'

        };
        if (this.isVirtualClassroom) {
          this._analytics.trackButtonClickEvent(ButtonType.Filter, 'Events_session_users_sort', trackEventValues[event.field], 'VC_session_dashboard');
        } else {
          this._analytics.trackButtonClickEvent(ButtonType.Filter, 'Events_session_users_sort', trackEventValues[event.field]);
        }

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

  public updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        const height = document.getElementById('analyticsApp').getBoundingClientRect().height;
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height });
      }, 0);
    }
  }

  public onRowExpanded(): void {
    if (this.isVirtualClassroom) {
      this._analytics.trackButtonClickEvent(ButtonType.Expand, 'VC_session_expand_user', null, 'VC_session_dashboard');
    } else {
      this._analytics.trackButtonClickEvent(ButtonType.Expand, 'Events_session_expand_user');
    }
  }

  public _onSearch(): void {
    if (this._peopleSearch.trim().length > 2 || this._peopleSearch.trim() === '') {
      this._isBusy = true;
      this._showMaxUsersMessage = false;
      this._kalturaClient.request(new UserListAction({
        pager: new KalturaFilterPager({pageSize: 500, pageIndex: 0}),
        filter: new KalturaUserFilter({
          firstNameOrLastNameStartsWith: this._peopleSearch.trim()
        })
      }))
        .pipe(cancelOnDestroy(this))
        .subscribe(response => {
            if (response?.objects?.length) {
              const userIds = response.objects.map(user => user.id).join(analyticsConfig.valueSeparator);
              this._loadReport({ table: this._dataConfig[ReportDataSection.table] }, userIds);
              this._showMaxUsersMessage = response.objects.length === 500;
            } else {
              this._loadReport({ table: this._dataConfig[ReportDataSection.table] }, this._peopleSearch + Math.random()); // make sure no users will be found
            }
          },
          error => {
            this._isBusy = false;
            const actions = {
              'close': () => {
                this._blockerMessage = null;
              },
              'retry': () => {
                this._onSearch();
              },
            };
            this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
          });
    }
  }

  public _showOverlay(event: any, data: any): void {
    if (this._overlay && !analyticsConfig.multiAccount && (data?.role || data?.company || data?.industry || data?.country)) {
      this._userData = data;
      this._overlay.show(event);
    }
  }

  public _hideOverlay(): void {
    if (this._overlay && !analyticsConfig.multiAccount) {
      this._overlay.hide();
      this._userData = null;
    }
  }

  ngOnDestroy(): void {}
}
