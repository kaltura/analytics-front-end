import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportHelper, ReportConfig } from 'shared/services';
import { KalturaReportInputFilter, KalturaFilterPager, KalturaReportTable, KalturaReportTotal, KalturaReportGraph, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { lineChartColors, barChartColors } from 'shared/color-schemes/color-schemes';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './publisher-storage.component.html',
  styleUrls: ['./publisher-storage.component.scss'],
  providers: []
})
export class PublisherStorageComponent implements OnInit {

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics = 'bandwidth_consumption';
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: any[] = [];
  public _tabsData: Tab[] = [];
  public _showTable = false;
  public _chartType = 'line';
  public _lineChartData: any = {'bandwidth_consumption': []};
  public _barChartData: any = {'bandwidth_consumption': []};

  public _isBusy: boolean;
  public _csvExportHeaders = '';
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;

  public lineChartColors = lineChartColors;
  public barChartColors = barChartColors;

  public _accumulativeStorage: string;
  public _accumulativeBwStorage: string;

  public pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  public reportType: KalturaReportType = KalturaReportType.partnerUsage;
  public filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private order = '-bandwidth_consumption';

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService) {
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

  public _onPaginationChanged(event): void {
    if (event.page !== (this.pager.pageIndex - 1)) {
      this.pager.pageIndex = event.page + 1;
      this.loadReport(true);
    }
  }

  public _onSortChanged(event) {
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this.order) {
        this.order = order;
        this.loadReport(true);
      }
    }
  }

  public toggleTable(): void {
    this._showTable = !this._showTable;
    if ( analyticsConfig.callbacks && analyticsConfig.callbacks.updateLayout ) {
      analyticsConfig.callbacks.updateLayout();
    }
  }

  private loadReport(tableOnly: boolean = false): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, tableOnly, false)
      .subscribe( (report: Report) => {
          if (report.table && report.table.header && report.table.data) {
            this.handleTable(report.table); // handle table
          }
          if (report.graphs && !tableOnly) {
            this._chartDataLoaded = false;
            this.handleGraphs(report.graphs); // handle graphs
          }
          if (report.totals && !tableOnly) {
            this.handleTotals(report.totals); // handle totals
          }
          this.updateChartType();
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

  private handleTable(table: KalturaReportTable): void {
    this._totalCount = table.totalCount;
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
    this._tabsData = [];
    const data = totals.data.split(',');
    const excludedFields = ['aggregated_monthly_avg_storage', 'combined_bandwidth_aggregated_storage'];
    totals.header.split(',').forEach( (header, index) => {
      if (excludedFields.indexOf(header) === -1) {
        const tab: Tab = {
          title: this._translate.instant('app.bandwidth.' + header),
          tooltip: this._translate.instant('app.bandwidth.' + header + '_tt'),
          value: ReportHelper.format(header, data[index]),
          selected: header === this._selectedMetrics,
          units: 'MB',
          key: header
        };
        this._tabsData.push(tab);
      } else {
        if (header === 'aggregated_monthly_avg_storage') {
          this._accumulativeStorage = ReportHelper.format(header, data[index]);
        } else {
          this._accumulativeBwStorage = ReportHelper.format(header, data[index]);
        }
      }
    });
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    this._lineChartData = {};
    this._barChartData = {};
    graphs.forEach( (graph: KalturaReportGraph) => {
      const data = graph.data.split(';');
      let values = [];
      data.forEach((value) => {
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
      this._barChartData[graph.id] = values;
      this._lineChartData[graph.id] = [{ name: 'Value', series: values}];

      setTimeout(() => {
        this._chartDataLoaded = true;
      }, 200);

    });
  }

  private updateChartType(): void {
    this._chartType = ((this._selectedMetrics === 'added_storage' || this._selectedMetrics === 'deleted_storage') && this._reportInterval === KalturaReportInterval.months) ? 'bar' : 'line';
  }

  private prepareCsvExportHeaders(): void {
    let headers = '';
    this._tabsData.forEach( (total: Tab) => {
      headers = headers + total.title + ',';
    });
    headers = headers.substr(0, headers.length - 1) + ';';
    this._columns.forEach( col => {
      headers = headers + this._translate.instant('app.bandwidth.' + col ) + ',';
    });
    this._csvExportHeaders = headers.substr(0, headers.length - 1);
  }

}
