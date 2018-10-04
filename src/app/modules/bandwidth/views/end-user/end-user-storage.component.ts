import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportHelper } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportTable, KalturaReportTotal, KalturaUser,
  KalturaReportGraph, KalturaReportInterval, ReportGetUrlForReportAsCsvActionArgs, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { BrowserService } from 'shared/services/browser.service';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './end-user-storage.component.html',
  styleUrls: ['./end-user-storage.component.scss']
})
export class EndUserStorageComponent implements OnInit {

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _metrics: SelectItem[] = [];
  public _selectedMetrics = 'added_storage_mb';
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: any[] = [];
  public _tabsData: Tab[] = [];
  public _chartData: any = {'added_storage_mb': []};

  public _isBusy: boolean;
  public _exportingCsv: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _drillDown = '';

  private order = '-added_entries';
  private reportType: KalturaReportType = KalturaReportType.userUsage;

  private filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _browserService: BrowserService) { }

  ngOnInit() {
    this._isBusy = false;
    this._exportingCsv = false;
  }

  public onDateFilterChange(event: DateChangeEvent): void {
    this._chartDataLoaded = false;
    this.filter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDay = event.startDay;
    this.filter.toDay = event.endDay;
    this.filter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this.loadReport(false);
  }

  public onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
  }

  public onSearchUsersChange(users): void {
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

  public onDrillDown(user: string): void {
    this._drillDown = user.length ? user : '';
    this.reportType = user.length ? KalturaReportType.specificUserUsage : KalturaReportType.userUsage;
    this.filter.userIds = user.length ? user : '';
    this.loadReport(false);
  }

  public exportToScv(): void {
    this._exportingCsv = true;
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
    const args: ReportGetUrlForReportAsCsvActionArgs = {
      dimension: this._selectedMetrics,
      pager: new KalturaFilterPager({pageSize: 1000000, pageIndex: 1}),
      reportType: this.reportType,
      reportInputFilter: this.filter,
      headers: headers.substr(0, headers.length - 1),
      reportText: this._translate.instant('app.common.noMsg'),
      reportTitle: this._translate.instant('app.bandwidth.usersStorage')
    };
    this._reportService.exportToCsv(args).subscribe(
      result => {
        this._exportingCsv = false;
        this._browserService.alert({
          message: this._translate.instant('app.common.reportReady'),
          header: this._translate.instant('app.common.attention'),
          accept: () => {
            this._browserService.download(result, this._translate.instant('app.bandwidth.publisherStorage') + '.csv', 'text/csv');
          }
        });
      },
      error => {
        this._exportingCsv = false;
        const err: ErrorDetails = this._errorsManager.getError(error);
        this._browserService.alert({ message: err.message, header: err.title});
      }
    );
  }

  private loadReport(tableOnly: boolean = false): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});

    this._reportService.getReport(tableOnly, true, this.reportType, this.filter, pager, this.order)
      .subscribe( (report: Report) => {
          if (report.table && report.table.header && report.table.data) {
            let header = report.table.header;
            let data = report.table.data;
            if (this._drillDown.length && report.baseTotals) {
              const tableTotals = this._reportService.addTableTotals(report); // add totals to table
              header = tableTotals.headers;
              data = tableTotals.data;
            }
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
    const noUnits = ['added_msecs','deleted_msecs','total_msecs'];

    totals.header.split(',').forEach( (header, index) => {
        const tab: Tab = {
          title: this._translate.instant('app.bandwidth.' + header),
          value: ReportHelper.format(header, data[index]),
          selected: header === this._selectedMetrics,
          units: noUnits.indexOf(header) > -1 ? '' : 'MB',
          key: header
        }
        this._tabsData.push(tab);
    });
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    this._chartData = {};
    const inMiliseconds = ['added_msecs','deleted_msecs','total_msecs'];
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
          if (inMiliseconds.indexOf(graph.id) !== -1) {
            val = Math.round(val / 60000); // value is received in ms. need to convert to minutes
          }
          values.push({name, 'value': val});
        }
      });
      if (this._reportInterval === KalturaReportInterval.months) {
        this._chartData[graph.id] = values;
      } else {
        this._chartData[graph.id] = [{ name: 'Value', series: values}];
      }
      setTimeout(() => {
        this._chartDataLoaded = true;
      }, 200);

    });
  }

}
