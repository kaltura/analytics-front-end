import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportHelper } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportTable, KalturaReportTotal, KalturaUser,
  KalturaReportGraph, KalturaReportInterval, ReportGetUrlForReportAsCsvActionArgs, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { BrowserService } from 'shared/services/browser.service';
import { ISubscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { EndUserStorageService } from './end-user-storage.service';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './end-user-storage.component.html',
  styleUrls: ['./end-user-storage.component.scss'],
  providers: [EndUserStorageService]
})
export class EndUserStorageComponent implements OnInit {

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _metrics: SelectItem[] = [];
  public _selectedMetrics = 'added_storage_mb';
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: any[] = [];
  public _totalsData: {label, value}[] = [];
  public _chartData: any = {'added_storage_mb': []};

  public _selectedUsers: KalturaUser[] = [];
  public _usersProvider = new Subject<SuggestionsProviderData>();

  public _isBusy: boolean;
  public _exportingCsv: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];

  private _searchUsersSubscription: ISubscription;
  private order = '-added_storage_mb';

  private filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _endUserStorageService: EndUserStorageService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _browserService: BrowserService) { }

  ngOnInit() {
    this._isBusy = false;
    this._exportingCsv = false;
    const metrics: string[] = ['added_storage_mb', 'deleted_storage_mb', 'total_storage_mb', 'added_entries', 'deleted_entries', 'total_entries', 'added_msecs', 'deleted_msecs', 'total_msecs'];
    metrics.forEach( key => {
      this._metrics.push({label: this._translate.instant('app.bandwidth.' + key), value: key});
    });
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

  public onMetricsChange(event): void {
    this._selectedMetrics = event.value;
  }

  public drillDown(user): void {
    debugger;
  }

  public exportToScv(): void {
    this._exportingCsv = true;
    let headers = '';
    this._totalsData.forEach( total => {
      headers = headers + total.label + ',';
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
      reportType: KalturaReportType.userUsage,
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

    this._reportService.getReport(tableOnly, true, KalturaReportType.userUsage, this.filter, pager, this.order)
      .subscribe( (report: Report) => {
          if (report.table) {
            this.handleTable(report.table); // handle table
          }
          if (report.graphs && !tableOnly) {
            this._chartDataLoaded = false;
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

  private handleTable(table: KalturaReportTable): void {
    // set table columns
    if (table.header) {
      this._columns = [];
      table.header.split(',').forEach(header => {
        this._columns.push(header);
      });
    }
    // set table data
    if (table.data) {
      table.data.split(';').forEach(valuesString => {
        if (valuesString.length) {
          let data = {};
          let userId = '';
          valuesString.split(',').forEach((value, index) => {
            if (index < 2) { // handle user
              if (index === 0) {
                this._columns[index] = 'HIDDEN'; // user ID column, save the data and hide the column
                userId = value;
              } else {
                data[this._columns[index]] = {name: value, id: userId}; // user name column, add the user ID to this column data
              }
            } else {
              data[this._columns[index]] = ReportHelper.format(this._columns[index], value);
            }
          });
          this._tableData.push(data);
        }
      });
    }
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._totalsData = [];
    const data = totals.data.split(',');
    totals.header.split(',').forEach( (header, index) => {
      this._totalsData.push({label: this._translate.instant('app.bandwidth.' + header), value: ReportHelper.format(header, data[index])});
    });
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    this._chartData = {};
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
          values.push({name, value: val});
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

  /* --- users search using auto-complete component code starts here --- */

  // TODO consider moving to a shared component with its UI and service

  public _searchUsers(event): void {
    this._usersProvider.next({ suggestions : [], isLoading : true});

    if (this._searchUsersSubscription) {
      // abort previous request
      this._searchUsersSubscription.unsubscribe();
      this._searchUsersSubscription = null;
    }

    this._searchUsersSubscription = this._endUserStorageService.searchUsers(event.query).subscribe(data => {
        const suggestions = [];
        (data || []).forEach((suggestedUser: KalturaUser) => {
          suggestedUser['__tooltip'] = suggestedUser.id;
          let isSelectable = !this._selectedUsers.find(user => {
            return user.id === suggestedUser.id;
          });
          suggestions.push({
            name: `${suggestedUser.screenName} (${suggestedUser.id})`,
            item: suggestedUser,
            isSelectable: isSelectable
          });
        });
        this._usersProvider.next({suggestions: suggestions, isLoading: false});
      },
      (err) => {
        this._usersProvider.next({ suggestions : [], isLoading : false, errorMessage : <any>(err.message || err)});
      });
  }

  public _convertUserInputToValidValue(value: string): any {
    let result = null;
    const tooltip = this._translate.instant('app.bandwidth.userTooltip', {0: value});
    if (value) {
      result =  {
        id : value,
        screenName: value,
        __tooltip: tooltip
      };
    }
    return result;
  }

  public _updateUsers(event): void {
    let users = [];
    this._selectedUsers.forEach((user: KalturaUser) => {
      users.push(user.screenName);
    });
    if (users.toString().length) {
      this.filter.userIds = users.toString();
    } else {
      this.filter.userIds = '';
    }
    this.loadReport(false);
  }

  /* --- users search using auto-complete component code ends here --- */

}
