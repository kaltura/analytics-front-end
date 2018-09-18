import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportHelper } from 'shared/services';
import { KalturaReportInputFilter, KalturaFilterPager, KalturaReportTable, KalturaReportTotal, KalturaReportGraph, KalturaReportInterval, ReportGetUrlForReportAsCsvActionArgs, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { BrowserService } from 'shared/services/browser.service';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './publisher-storage.component.html',
  styleUrls: ['./publisher-storage.component.scss'],
  providers: []
})
export class PublisherStorageComponent implements OnInit {

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _metrics: SelectItem[] = [];
  public _selectedMetrics = 'bandwidth_consumption';
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: any[] = [];
  public _totalsData: {label, value}[] = [];
  public _chartData: any = {'bandwidth_consumption': []};

  public _isBusy: boolean;
  public _exportingCsv: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];

  private order = '-bandwidth_consumption';
  private totalCount = 1;

  private filter: KalturaReportInputFilter = new KalturaReportInputFilter(
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
    const metrics: string[] = ['bandwidth_consumption', 'average_storage', 'peak_storage', 'added_storage', 'deleted_storage', 'combined_bandwidth_storage', 'transcoding_consumption'];
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

  public exportToScv(): void {
    this._exportingCsv = true;
    let headers = '';
    this._totalsData.forEach( total => {
      headers = headers + total.label + ',';
    });
    headers = headers.substr(0, headers.length - 1) + ';';
    this._columns.forEach( col => {
      headers = headers + this._translate.instant('app.bandwidth.' + col ) + ',';
    });
    const args: ReportGetUrlForReportAsCsvActionArgs = {
      dimension: this._selectedMetrics,
      pager: new KalturaFilterPager({pageSize: this.totalCount, pageIndex: 1}),
      reportType: KalturaReportType.partnerUsage,
      reportInputFilter: this.filter,
      headers: headers.substr(0, headers.length - 1),
      reportText: this._translate.instant('app.common.noMsg'),
      reportTitle: this._translate.instant('app.bandwidth.title')
    };
    this._reportService.exportToCsv(args).subscribe(
      result => {
        this._exportingCsv = false;
        this._browserService.alert({
          message: this._translate.instant('app.common.reportReady'),
          header: this._translate.instant('app.common.attention'),
          accept: () => {
            this._browserService.download(result, this._translate.instant('app.bandwidth.title') + '.csv', 'text/csv');
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

    this._reportService.getReport(tableOnly, false, KalturaReportType.partnerUsage, this.filter, pager, this.order)
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
    this.totalCount = table.totalCount;
    // set table columns
    this._columns = [];
    table.header.split(',').forEach( header => {
      this._columns.push(header);
    });
    // set table data
    table.data.split(';').forEach( valuesString => {
      if ( valuesString.length ) {
        let data = {};
        valuesString.split(',').forEach((value, index) => {
          if (index === 0) { // handle date
            if (this._columns[index] === 'date_id') {
              data[this._columns[index]] = DateFilterUtils.formatFullDateString(value, analyticsConfig.locale);
            } else {
              data[this._columns[index]] = DateFilterUtils.formatMonthString(value, analyticsConfig.locale);
            }
          } else {
            data[this._columns[index]] = ReportHelper.format(this._columns[index], value);
          }
        });
        this._tableData.push(data);
      }
    });
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
          let val = Math.ceil(parseFloat(value.split(',')[1])); // publisher storage report should round up graph values
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

}
