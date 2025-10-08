import {Component, Input, OnDestroy} from '@angular/core';
import {
  BaseEntryListAction,
  KalturaBaseEntryFilter,
  KalturaClient,
  KalturaDetachedResponseProfile,
  KalturaEndUserReportInputFilter,
  KalturaEntryStatus,
  KalturaFilterPager,
  KalturaPager,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportTotal,
  KalturaReportType,
  KalturaResponseProfileType,
  KalturaBaseEntryListResponse
} from 'kaltura-ngx-client';
import {ReportDataConfig} from 'shared/services/storage-data-base.config';
import {TableRow} from 'shared/utils/table-local-sort-handler';
import {analyticsConfig} from 'configuration/analytics-config';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {AppAnalytics, AuthService, ButtonType, ErrorsManagerService, NavigationDrillDownService, ReportConfig, ReportService} from 'shared/services';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {SortEvent} from 'primeng/api';
import {ContentOnDemandConfig} from './content-on-demand.config';
import {reportTypeMap} from 'shared/utils/report-type-map';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-event-user-content-on-demand',
  templateUrl: './content-on-demand.component.html',
  styleUrls: ['./content-on-demand.component.scss'],
  providers: [ContentOnDemandConfig],
})
export class ContentOnDemandComponent implements OnDestroy {

  @Input() eventIn = '';
  @Input() userId = '';
  @Input() set virtualEventLoaded(value: boolean) {
    if (value === true) {
      // use timeout to allow data binding to finish
      setTimeout(() => {
        this._loadReport();
      }, 0);
    }
  }
  @Input() exporting = false;
  @Input() startDate: Date;

  private _reportType = reportTypeMap(KalturaReportType.topContentCreator);
  private _dataConfig: ReportDataConfig;
  private _order = '-count_plays';
  private _totalPlays = 0;
  public _tableData: TableRow[] = [];
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http') ? analyticsConfig.kalturaServer.uri : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private _partnerId = this._authService.pid;
  public _columns: string[] = [];
  public totalCount = 0;
  public firstTimeLoading = true;
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: 3 });
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _analytics: AppAnalytics,
              private _kalturaClient: KalturaClient,
              _dataConfigService: ContentOnDemandConfig,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnDestroy(): void {
  }

  private _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.virtualEventIdIn = this.eventIn;
    this._filter.userIds = this.userId;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(new Date().getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    if (analyticsConfig.customData?.eventContentCategoryFullName) {
      this._filter.categories = analyticsConfig.customData.eventContentCategoryFullName;
    }
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          this._tableData = [];
          this.firstTimeLoading = false;
          if (report.totals && report.totals.data && report.totals.header) {
            this._handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.data && report.table.header) {
            this._handleTable(report.table); // handle table
          }
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

  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    this._totalPlays = tabsData[0].rawValue !== '' ? parseInt(tabsData[0].rawValue.toString()) : 0;
  }

  private _handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this.totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData.map((item, index) => this._extendTableRow(item, index, this._pager));
    this.loadEntriesData();
  }

  private _extendTableRow (item: TableRow<string>, index: number, pager: KalturaPager): TableRow<string> {
    item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/256/height/144`;
    item['playRate'] = (parseInt(item['count_plays']) / this._totalPlays * 100).toFixed(1);
    return item;
  }

  private loadEntriesData(): void {
    // load the entries to check if we have deleted entries
    const entryIds = this._tableData.map(item => item.object_id).join(",");
    const request = new BaseEntryListAction({ pager: this._pager, filter: new KalturaBaseEntryFilter({idIn: entryIds, statusIn: '0,1,2,3,4,5,6,7'}) })
      .setRequestOptions({
        responseProfile: new KalturaDetachedResponseProfile({
          type: KalturaResponseProfileType.includeFields,
          fields: 'id,status'
        })
      });

    this._kalturaClient
      .request(request)
      .pipe(cancelOnDestroy(this))
      .subscribe((response: KalturaBaseEntryListResponse) => {
        if (response.objects.length) {
          response.objects.forEach(entry => {
            const item = this._tableData.find(item => item.object_id === entry.id);
            if (item) {
              item['deleted'] = entry.status === KalturaEntryStatus.deleted;
            }
          });
        }
      },
      error => {
        const actions = {
          'close': () => {
            this._blockerMessage = null;
          }
        };
        this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
      });
  }

  public _onPaginationChanged(event: { page: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._analytics.trackButtonClickEvent(ButtonType.Filter, 'events_user_dashboard_content_paginate', this._pager.pageIndex.toString(), 'events_user_dashboard');
      this._loadReport();
    }
  }

  public _onSortChanged(event: SortEvent): void {
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._analytics.trackButtonClickEvent(ButtonType.Filter, 'events_user_dashboard_content_sort', event.field, 'events_user_dashboard');
        this._order = order;
        this._pager.pageIndex = 1;
        this._loadReport();
      }
    }
  }

  public _drillDown(row: TableRow): void {
    if (!row['deleted']) {
      this._analytics.trackButtonClickEvent(ButtonType.Choose, 'events_user_dashboard_content_content_click', row['object_id'], 'events_user_dashboard');
      this._navigationDrillDownService.drilldown('entry', row['object_id'], true, row['partner_id']);
    }
  }
}


