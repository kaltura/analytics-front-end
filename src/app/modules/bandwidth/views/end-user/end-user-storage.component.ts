import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent, DateRangeType, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType, KalturaUser } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { UsersFilterComponent } from 'shared/components/users-filter/users-filter.component';
import { EndUserStorageDataConfig } from './end-user-storage-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './end-user-storage.component.html',
  styleUrls: ['./end-user-storage.component.scss'],
  providers: [
    KalturaLogger.createLogger('EndUserStorageComponent'),
    EndUserStorageDataConfig,
  ]
})
export class EndUserStorageComponent implements OnInit {

  @ViewChild('userFilter') private userFilter: UsersFilterComponent;

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: any[] = [];
  public _tabsData: Tab[] = [];
  public _lineChartData: any = {'bandwidth_consumption': []};
  public _barChartData: any = {'bandwidth_consumption': []};
  public _chartType = 'line';
  public _showTable = false;
  public _totalCount: number;
  public _dateRange = DateRanges.CurrentQuarter;

  public _isBusy: boolean;
  public _csvExportHeaders = '';
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _drillDown = '';
  public _tags: any[] = [];

  public pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  public reportType: KalturaReportType = KalturaReportType.userUsage;
  public compareFilter: KalturaEndUserReportInputFilter = null;
  public filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private order = '-total_storage_mb';
  private selectedUsers = '';
  private _dataConfig: ReportDataConfig = null;

  public get isCompareMode(): boolean {
    return this.compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: EndUserStorageDataConfig,
              private _logger: KalturaLogger) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
    this._isBusy = false;
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._logger.trace('Handle date filter change action by user', () => ({ event }));
    this._chartDataLoaded = false;
    this.filter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDay = event.startDay;
    this.filter.toDay = event.endDay;
    this.filter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this.pager.pageIndex = 1;
    if (event.compare.active) {
      const compare = event.compare;
      this.compareFilter = new KalturaEndUserReportInputFilter(
        {
          searchInTags: true,
          searchInAdminTags: false,
          timeZoneOffset: event.timeZoneOffset,
          interval: event.timeUnits,
          fromDay: compare.startDay,
          toDay: compare.endDay,
          userIds: this.filter.userIds,
        }
      );
    } else {
      this.compareFilter = null;
    }
    this.loadReport();
  }

  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
    this.updateChartType();
  }

  public _onSearchUsersChange(users): void {
    this._logger.trace('Handle search users action by user', { users });
    let usersIds = [];
    this._tags = users;
    users.forEach((user: KalturaUser) => {
      usersIds.push(user.id);
    });
    if (usersIds.toString().length) {
      this.selectedUsers = usersIds.toString();
    } else {
      this.selectedUsers = '';
    }
    this.filter.userIds = this.selectedUsers;

    if (this.compareFilter) {
      this.compareFilter.userIds = this.filter.userIds;
    }
    this.loadReport();
  }

  public _onDrillDown(user: string): void {
    this._logger.trace('Handle drill down to a user details action by user, reset page index to 1', { user });
    this._drillDown = user.length ? user : '';
    this.reportType = user.length ? KalturaReportType.specificUserUsage : KalturaReportType.userUsage;
    this.filter.userIds = user.length ? user : this.selectedUsers;
    this.pager.pageIndex = 1;
    if (this.compareFilter) {
      this.compareFilter.userIds = this.filter.userIds;
    }

    this.order = user.length ? '-month_id' : '-total_storage_mb';
    this.loadReport();
  }

  public toggleTable(): void {
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

  public _onPaginationChanged(event): void {
    if (event.page !== (this.pager.pageIndex - 1)) {
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      this.pager.pageIndex = event.page + 1;
      this.loadReport({ table: null });
    }
  }

  public _onRemoveTag(user: KalturaUser): void {
    this._logger.trace('Handle clear user filter action by user', { userId: user.id });
    this.userFilter.removeUser(user.id);
  }

  public _onRemoveAllTags(): void {
    this._logger.trace('Handle clear all users filter action by user');
    this.userFilter.removeAll();
  }

  private loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this.reportType, filter: this.compareFilter, pager: this.pager, order: this.order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe( ({ report, compare }) => {
          if (compare) {
            this.handleCompare(report, compare);
          } else {
            if (report.table && report.table.header && report.table.data) {
              this.handleTable(report.table); // handle table
            }
            if (report.graphs.length) {
              this._chartDataLoaded = false;
              this.handleGraphs(report.graphs); // handle graphs
            }
            if (report.totals) {
              this.handleTotals(report.totals); // handle totals
            }
          }
          this.prepareCsvExportHeaders();
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if ( err.forceLogout ) {
            buttons = [{
              label: this._translate.instant('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
                this._authService.logout();
              }
            }];
          } else {
            buttons = [{
              label: this._translate.instant('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            },
              {
                label: this._translate.instant('app.common.retry'),
                action: () => {
                  this.loadReport();
                }
              }];
          }
          this._blockerMessage = new AreaBlockerMessage({
            title: err.title,
            message: err.message,
            buttons
          });
        });
  }

  _onSortChanged(event) {
    setTimeout(() => {
      if (event.data.length && event.field && event.order && event.order !== 1 && !this.isCompareMode) {
        const order = event.order === 1 ? '+' + event.field : '-' + event.field;
        if (order !== this.order) {
          this._logger.trace('Handle sort changed action by user', { order });
          this.order = order;
          this.pager.pageIndex = 1;
          this.loadReport({ table: null });
        }
      } else {
        return 1;
      }
    }, 0);
  }

  private handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this.filter.fromDay, to: this.filter.toDay };
    const comparePeriod = { from: this.compareFilter.fromDay, to: this.compareFilter.toDay };

    const dataKey = this._drillDown.length ? '' : 'kuser_id';
    if (current.table && compare.table) {
      const { columns, tableData } = this._compareService.compareTableData(
        currentPeriod,
        comparePeriod,
        current.table,
        compare.table,
        this._dataConfig.table,
        this._reportInterval,
        dataKey
      );
      this._columns = columns;
      this._totalCount = compare.table.totalCount;
      this._tableData = tableData;
    }

    if (current.totals && compare.totals) {
      this._tabsData = this._compareService.compareTotalsData(
        currentPeriod,
        comparePeriod,
        current.totals,
        compare.totals,
        this._dataConfig.totals,
        this._selectedMetrics
      );
    }

    if (current.graphs.length && compare.graphs.length) {
      const { lineChartData, barChartData } = this._compareService.compareGraphData(
        currentPeriod,
        comparePeriod,
        current.graphs,
        compare.graphs,
        this._dataConfig.graph,
        this._reportInterval,
        () => this._chartDataLoaded = true
      );
      this._lineChartData = lineChartData;
      this._barChartData = barChartData;
    }
  }

  private handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData;
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData, barChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this.filter.fromDay, to: this.filter.toDay },
      this._reportInterval,
      () => this._chartDataLoaded = true
    );
    this._lineChartData = lineChartData;
    this._barChartData = barChartData;
  }

  private updateChartType(): void {
    this._chartType = ((this._selectedMetrics === 'added_storage_mb' || this._selectedMetrics === 'deleted_storage_mb') && this._reportInterval === KalturaReportInterval.months) ? 'bar' : 'line';
  }

  private prepareCsvExportHeaders(): void {
    this._csvExportHeaders = this._dataConfigService.prepareCsvExportHeaders(this._tabsData, this._columns, 'app.bandwidth');
  }
}
