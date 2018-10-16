import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportHelper, ReportConfig } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportTotal, KalturaUser, KalturaReportGraph, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './end-user-storage.component.html',
  styleUrls: ['./end-user-storage.component.scss']
})
export class EndUserStorageComponent implements OnInit {

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics = 'added_storage_mb';
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

  public pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  public reportType: KalturaReportType = KalturaReportType.userUsage;
  public filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private order = '-added_entries';

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService) { }

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
    users.forEach((user: KalturaUser) => {
      usersIds.push(user.id);
    });
    if (usersIds.toString().length) {
      this.filter.userIds = usersIds.toString();
    } else {
      this.filter.userIds = '';
    }
    this.loadReport(false);
  }

  public _onDrillDown(user: string): void {
    this._drillDown = user.length ? user : '';
    this.reportType = user.length ? KalturaReportType.specificUserUsage : KalturaReportType.userUsage;
    this.filter.userIds = user.length ? user : '';
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

  private loadReport(tableOnly: boolean = false): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, tableOnly, true)
      .subscribe( (report: Report) => {
          if (report.table && report.table.header && report.table.data) {
            let header = report.table.header;
            let data = report.table.data;
            // TODO - remove once table totals are returned in production (currently implemented only on lbd.kaltura.com)
            // if (this._drillDown.length && report.baseTotals) {
            //   const tableTotals = this._reportService.addTableTotals(report); // add totals to table
            //   header = tableTotals.headers;
            //   data = tableTotals.data;
            // }
            this._totalCount = report.table.totalCount;
            this.handleTable(header, data); // handle table
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

  private handleTable(header: string,  data: string): void {
    // set table columns
    if (header.length) {
      this._columns = [];
      header.split(',').forEach(hdr => {
        this._columns.push(hdr);
      });
    }
    // set table data
    if (data.length) {
      if (this._drillDown.length) {
        data.split(';').forEach( valuesString => {
          if ( valuesString.length ) {
            let dataObj = {};
            valuesString.split(',').forEach((value, index) => {
              if (index === 0) { // handle date
                if (this._columns[index] === 'date_id') {
                  dataObj[this._columns[index]] = DateFilterUtils.formatFullDateString(value, analyticsConfig.locale);
                } else {
                  dataObj[this._columns[index]] = DateFilterUtils.formatMonthString(value, analyticsConfig.locale);
                }
              } else {
                dataObj[this._columns[index]] = ReportHelper.format(this._columns[index], value);
              }
            });
            this._tableData.push(dataObj);
          }
        });
      } else {
        data.split(';').forEach(valuesString => {
          if (valuesString.length) {
            let dataObj = {};
            let userId = '';
            valuesString.split(',').forEach((value, index) => {
              if (index < 2) { // handle user
                if (index === 0) {
                  this._columns[index] = 'HIDDEN'; // user ID column, save the data and hide the column
                  userId = value;
                } else {
                  dataObj[this._columns[index]] = {name: value, id: userId}; // user name column, add the user ID to this column data
                }
              } else {
                dataObj[this._columns[index]] = ReportHelper.format(this._columns[index], value);
              }
            });
            this._tableData.push(dataObj);
          }
        });
      }
    }
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = [];
    const data = totals.data.split(',');
    const noUnits = ['added_msecs', 'deleted_msecs', 'total_msecs'];

    totals.header.split(',').forEach( (header, index) => {
        const tab: Tab = {
          title: this._translate.instant('app.bandwidth.' + header),
          tooltip: this._translate.instant('app.bandwidth.' + header + '_tt'),
          value: ReportHelper.format(header, data[index]),
          selected: header === this._selectedMetrics,
          units: noUnits.indexOf(header) > -1 ? '' : 'MB',
          key: header
        };
        this._tabsData.push(tab);
    });
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    this._lineChartData = {};
    this._barChartData = {};
    const inMilliseconds = ['added_msecs', 'deleted_msecs', 'total_msecs'];
    graphs.forEach( (graph: KalturaReportGraph) => {
      const data = graph.data.split(';');
      let values = [];
      data.forEach(value => {
        if (value.length) {
          const label = value.split(',')[0];
          const name = this._reportInterval === KalturaReportInterval.months ? DateFilterUtils.formatMonthString(label, analyticsConfig.locale) : DateFilterUtils.formatFullDateString(label, analyticsConfig.locale);
          let val = Math.ceil(parseFloat(value.split(',')[1])); // end-user storage report should round up graph values
          if (isNaN(val)) {
            val = 0;
          }
          if (inMilliseconds.indexOf(graph.id) !== -1) {
            val = Math.round(val / 60000); // value is received in ms. need to convert to minutes
          }
          values.push({name, 'value': val});
        }
      });
      this._barChartData[graph.id] = values;
      this._lineChartData[graph.id] = [{ name: 'Value', series: values}];
      setTimeout(() => {
        this._chartDataLoaded = true;
      }, 200);

    });
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
