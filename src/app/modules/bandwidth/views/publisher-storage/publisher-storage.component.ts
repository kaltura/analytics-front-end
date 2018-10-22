import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService, ReportService, Report, ReportConfig } from 'shared/services';
import { KalturaReportInputFilter, KalturaFilterPager, KalturaReportTable, KalturaReportTotal, KalturaReportGraph, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { analyticsConfig } from 'configuration/analytics-config';
import { lineChartColors, barChartColors } from 'shared/color-schemes/color-schemes';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { PublisherStorageDataConfig } from './publisher-storage-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './publisher-storage.component.html',
  styleUrls: ['./publisher-storage.component.scss'],
  providers: [PublisherStorageDataConfig]
})
export class PublisherStorageComponent implements OnInit {
  private _dataConfig: ReportDataConfig;

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics: string;
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

  public _accumulativeStorage: any[] = [];

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
              private _authService: AuthService,
              _dataConfigService: PublisherStorageDataConfig) {
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
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    this._columns = columns;
    this._tableData = tableData;
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    this._accumulativeStorage = this._reportService.parseTotals(totals, this._dataConfig.accumulative);
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
