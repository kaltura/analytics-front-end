import { Component, Input, OnInit } from '@angular/core';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, ReportConfig, ReportService } from 'shared/services';
import { KalturaFilterPager, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DevicesOverviewConfig } from './devices-overview.config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';

@Component({
  selector: 'app-devices-overview',
  templateUrl: './devices-overview.component.html',
  styleUrls: ['./devices-overview.component.scss'],
  providers: [DevicesOverviewConfig]
})
export class DevicesOverviewComponent implements OnInit {
  @Input() allowedDevices: string[] = [];
  @Input() set filter(value: DateChangeEvent) {
    if (value) {
      this._chartDataLoaded = false;
      this._filter.timeZoneOffset = value.timeZoneOffset;
      this._filter.fromDay = value.startDay;
      this._filter.toDay = value.endDay;
      this._filter.interval = value.timeUnits;
      this._reportInterval = value.timeUnits;
      this._pager.pageIndex = 1;
      this.loadReport();
    }
  }
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _selectedMetrics: string;
  public _barChartData: any = { 'count_plays': {} };
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
              private _platformsConfigService: DevicesOverviewConfig) {
    this._platformDataConfig = _platformsConfigService.getConfig();
    this._selectedMetrics = this._platformDataConfig.totals.preSelected;
  }
  
  ngOnInit() {
  }
  
  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
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
            this.handleGraph(report.table); // handle grapgh
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
  
  private handleGraph(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._platformDataConfig.table);
    const graphData = tableData.filter(({ device }) => this.allowedDevices.includes(device));
    const xAxisData = graphData.map(({ device }) => this._translate.instant(`app.audience.technology.devices.${device}`));
    this._barChartData = Object.keys(this._platformDataConfig.totals.fields)
      .reduce((data, key) => {
        data[key] = {
          grid: {
            top: 24, left: 54, bottom: 24, right: 24
          },
          color: ['#00a784'],
          xAxis: {
            type: 'category',
            data: xAxisData
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            data: graphData.map((item) => item[key] || 0),
            type: 'bar'
          }]
        };
        
        return data;
      }, {});
  }
  
  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._platformDataConfig.totals, this._selectedMetrics);
    console.warn(this._tabsData);
  }
}
