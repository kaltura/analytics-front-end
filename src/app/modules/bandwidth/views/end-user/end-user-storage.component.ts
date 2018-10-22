import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportHelper, ReportConfig } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportTotal, KalturaUser, KalturaReportGraph, KalturaReportInterval, KalturaReportType, KalturaReportTable } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { UsersFilterComponent } from 'shared/components/users-filter/users-filter.component';
import { EndUserDataConfig } from './end-user-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './end-user-storage.component.html',
  styleUrls: ['./end-user-storage.component.scss'],
  providers: [EndUserDataConfig]
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
  public _chartType = 'bar';
  public _showTable = false;
  public _totalCount: number;

  public _isBusy: boolean;
  public _csvExportHeaders = '';
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _drillDown = '';
  public _tags: any[] = [];

  public pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  public reportType: KalturaReportType = KalturaReportType.userUsage;
  public filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private order = '-added_entries';
  private selectedUsers = '';
  private _dataConfig: ReportDataConfig = null;


  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              _dataConfigService: EndUserDataConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
    this._isBusy = false;
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._chartDataLoaded = false;
    this.filter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDay = event.startDay;
    this.filter.toDay = event.endDay;
    this.filter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this.loadReport(false);
  }

  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
    this.updateChartType();
  }

  public _onSearchUsersChange(users): void {
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
    this.filter.userIds = this.selectedUsers
    this.loadReport(false);
  }

  public _onDrillDown(user: string): void {
    this._drillDown = user.length ? user : '';
    this.reportType = user.length ? KalturaReportType.specificUserUsage : KalturaReportType.userUsage;
    this.filter.userIds = user.length ? user : this.selectedUsers;
    this.loadReport(false);
  }

  public toggleTable(): void {
    this._showTable = !this._showTable;
    if ( analyticsConfig.callbacks && analyticsConfig.callbacks.updateLayout ) {
      analyticsConfig.callbacks.updateLayout();
    }
  }

  public _onPaginationChanged(event): void {
    if (event.page !== (this.pager.pageIndex - 1)) {
      this.pager.pageIndex = event.page + 1;
      this.loadReport(true);
    }
  }

  public _onRemoveTag(user: KalturaUser): void {
    this.userFilter.removeUser(user.id);
  }

  public _onRemoveAllTags(): void {
    this.userFilter.removeAll();
  }

  private loadReport(tableOnly: boolean = false): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, tableOnly, true)
      .subscribe( (report: Report) => {
          if (report.table && report.table.header && report.table.data) {
            // TODO - remove once table totals are returned in production (currently implemented only on lbd.kaltura.com)
            // if (this._drillDown.length && report.baseTotals) {
            //   const tableTotals = this._reportService.addTableTotals(report); // add totals to table
            //   (<any>report.table).header = tableTotals.headers;
            //   (<any>report.table).data = tableTotals.data;
            // }
            this.handleTable(report.table); // handle table
          }
          if (report.graphs && !tableOnly) {
            this._chartDataLoaded = false;
            if (report.baseTotals) {
              this._reportService.addGraphTotals(report.graphs, report.baseTotals); // add totals to graph
            }
            this.handleGraphs(report.graphs); // handle graphs
          }
          if (report.totals && !tableOnly) {
            this.handleTotals(report.totals); // handle totals
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
                  this.loadReport(false);
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
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this.order) {
        this.order = order;
        this.loadReport(true);
      }
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
    let headers = '';
    this._tabsData.forEach( total => {
      headers = headers + total.title + ',';
    });
    headers = headers.substr(0, headers.length - 1) + ';';
    this._columns.forEach( col => {
      if (col !== 'HIDDEN') {
        headers = headers + this._translate.instant('app.bandwidth.' + col) + ',';
      } else {
        headers = headers + this._translate.instant('app.bandwidth.objectId') + ',';
      }
    });
    this._csvExportHeaders = headers.substr(0, headers.length - 1);
  }
}
