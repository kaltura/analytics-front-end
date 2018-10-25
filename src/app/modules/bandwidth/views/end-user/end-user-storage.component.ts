import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportHelper, ReportConfig } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportTotal, KalturaUser, KalturaReportGraph, KalturaReportInterval, KalturaReportType, KalturaReportTable, KalturaReportInputFilter } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { UsersFilterComponent } from 'shared/components/users-filter/users-filter.component';
import { EndUserStorageDataConfig } from './end-user-storage-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { barChartColors, barChartCompareColors, lineChartColors, lineChartCompareColors } from 'shared/color-schemes/color-schemes';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './end-user-storage.component.html',
  styleUrls: ['./end-user-storage.component.scss'],
  providers: [EndUserStorageDataConfig]
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
  
  public lineChartColors = lineChartColors;
  public barChartColors = barChartColors;

  public pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  public reportType: KalturaReportType = KalturaReportType.userUsage;
  public compareFilter: KalturaEndUserReportInputFilter = null;
  public filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private order = '-added_entries';
  private selectedUsers = '';
  private _dataConfig: ReportDataConfig = null;
  
  public get isCompareMode(): boolean {
    return this.compareFilter !== null;
  }

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _compareService: CompareService,
              _dataConfigService: EndUserStorageDataConfig) {
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
    if (event.compare.active) {
      const compare = event.compare;
      this.lineChartColors = lineChartCompareColors;
      this.barChartColors = barChartCompareColors;
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
      this.lineChartColors = lineChartColors;
      this.barChartColors = barChartColors;
    }
    this.loadReport();
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
    this.filter.userIds = this.selectedUsers;
    
    if (this.compareFilter) {
      this.compareFilter.userIds = this.filter.userIds;
    }
    this.loadReport();
  }

  public _onDrillDown(user: string): void {
    this._drillDown = user.length ? user : '';
    this.reportType = user.length ? KalturaReportType.specificUserUsage : KalturaReportType.userUsage;
    this.filter.userIds = user.length ? user : this.selectedUsers;
    if (this.compareFilter) {
      this.compareFilter.userIds = this.filter.userIds;
    }
    this.loadReport();
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
      this.loadReport({ table: null });
    }
  }

  public _onRemoveTag(user: KalturaUser): void {
    this.userFilter.removeUser(user.id);
  }

  public _onRemoveAllTags(): void {
    this.userFilter.removeAll();
  }

  private loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, sections, true)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
    
        const compareReportConfig = { reportType: this.reportType, filter: this.compareFilter, pager: this.pager, order: this.order };
        return this._reportService.getReport(compareReportConfig, sections, true)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe( ({ report, compare }) => {
          if (compare) {
            this.handleCompare(report, compare);
          } else {
            if (report.table && report.table.header && report.table.data) {
              // TODO - remove once table totals are returned in production (currently implemented only on lbd.kaltura.com)
              // if (this._drillDown.length && report.baseTotals) {
              //   const tableTotals = this._reportService.addTableTotals(report); // add totals to table
              //   (<any>report.table).header = tableTotals.headers;
              //   (<any>report.table).data = tableTotals.data;
              // }
              this.handleTable(report.table); // handle table
            }
            if (report.graphs.length) {
              this._chartDataLoaded = false;
              if (report.baseTotals) {
                this._reportService.addGraphTotals(report.graphs, report.baseTotals); // add totals to graph
              }
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
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this.order) {
        this.order = order;
        this.loadReport({ table: null });
      }
    }
  }
  
  private handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this.filter.fromDay, to: this.filter.toDay };
    const comparePeriod = { from: this.compareFilter.fromDay, to: this.filter.toDay };
    
    if (current.table && compare.table) {
      // TODO - remove once table totals are returned in production (currently implemented only on lbd.kaltura.com)
      // if (this._drillDown.length && current.baseTotals && compare.baseTotals) {
      //   const currentTotals = this._reportService.addTableTotals(current); // add totals to table
      //   const compareTotals = this._reportService.addTableTotals(compare); // add totals to table
      //   (<any>current.table).header = currentTotals.headers;
      //   (<any>current.table).data = currentTotals.data;
      //   (<any>current.table).header = compareTotals.headers;
      //   (<any>current.table).data = compareTotals.data;
      // }
      const { columns, tableData } = this._compareService.compareTableData(current.table, compare.table, this._dataConfig.table);
      this._columns = columns;
      this._tableData = tableData;
    }
    
    if (current.totals && compare.totals) {
      this._tabsData = this._compareService.compareTotalsData(current.totals, compare.totals, this._dataConfig.totals, this._selectedMetrics);
    }
    
    if (current.graphs && compare.graphs) {
      if (current.baseTotals && compare.baseTotals) {
        this._reportService.addGraphTotals(current.graphs, current.baseTotals); // add totals to graph
        this._reportService.addGraphTotals(compare.graphs, compare.baseTotals); // add totals to graph
      }
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
