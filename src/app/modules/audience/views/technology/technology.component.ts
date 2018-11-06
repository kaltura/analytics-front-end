import { Component, OnInit } from '@angular/core';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { KalturaFilterPager, KalturaReportGraph, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TechnologyPlatformReportConfig } from './technology-platform-report.config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';

@Component({
  selector: 'app-technology',
  templateUrl: './technology.component.html',
  styleUrls: ['./technology.component.scss'],
  providers: [TechnologyPlatformReportConfig]
})
export class TechnologyComponent implements OnInit {
  public _dateRange = DateRanges.Last30D;
  public _blockerMessage: AreaBlockerMessage = null;
  public _selectedMetrics: string;
  public _barChartData: any = {'count_plays': {}};
  public _isBusy = false;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tabsData: Tab[] = [];
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _platformDataConfig: ReportDataConfig;
  public _filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  
  constructor(private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _errorsManager: ErrorsManagerService,
              private _platformsConfigService: TechnologyPlatformReportConfig) {
    this._platformDataConfig = _platformsConfigService.getConfig();
    this._selectedMetrics = this._platformDataConfig.totals.preSelected;
  }
  
  ngOnInit() {
  }
  
  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
  }
  
  public _onDateFilterChange(event: DateChangeEvent): void {
    this._chartDataLoaded = false;
    this._filter.timeZoneOffset = event.timeZoneOffset;
    this._filter.fromDay = event.startDay;
    this._filter.toDay = event.endDay;
    this._filter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this._pager.pageIndex = 1;
    this.loadReport();
  }
  
  private loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = {
      reportType: KalturaReportType.platforms,
      filter: this._filter,
      pager: this._pager,
      order: ''
    };
    this._reportService.getReport(reportConfig, this._platformDataConfig, false)
      .subscribe(report => {
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
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if (err.forceLogout) {
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
  
  private handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._platformDataConfig.table);
    console.warn(columns, tableData);
  }
  
  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._platformDataConfig.totals, this._selectedMetrics);
  }
  
  private handleGraphs(graphs: KalturaReportGraph[]): void {
    const { barChartData } = this._reportService.parseGraphs(
      graphs,
      this._platformDataConfig.graph,
      this._reportInterval,
      () => this._chartDataLoaded = true
    );
    console.warn(barChartData);
    this._barChartData = barChartData;
  }
  
}
