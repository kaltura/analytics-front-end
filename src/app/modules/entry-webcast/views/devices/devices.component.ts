import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { AuthService, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { DevicesDataConfig } from './devices-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateRanges } from 'shared/components/date-filter/date-filter-utils';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { WebcastBaseReportComponent } from "../webcast-base-report/webcast-base-report.component";

@Component({
  selector: 'app-webcast-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  providers: [
    DevicesDataConfig,
    KalturaLogger.createLogger('WebcastDevicesComponent')
  ]
})
export class WebcastDevicesComponent extends WebcastBaseReportComponent implements OnInit, OnDestroy {

  @Input() entryIdIn = '';
  protected _componentId = 'webcast-devices';
  private _dataConfig: ReportDataConfig;
  public _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _reportType: KalturaReportType = reportTypeMap(KalturaReportType.platformsWebcast);
  private order = '-count_plays';
  public _selectedMetrics: string;
  public _selectedTotal: number;
  public _animate = true;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  public _dateRange = DateRanges.Last30D;
  public _devicesData: TableRow<any>[] = [];
  public _tabsData: Tab[] = [];
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = [];
  public _exportConfig: ExportItem[] = [];

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _dataConfigService: DevicesDataConfig,
              private _logger: KalturaLogger) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
  }

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this._filter);
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this.order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.totals) {
            this._handleTotals(report.totals); // handle totals
          }
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle table
          }
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadReport();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  private _handleTable(table: KalturaReportTable): void {
    this._devicesData = [];
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    tableData.forEach(row => {
      this._devicesData.push({
        name: row.device,
        avg_vod_completion_rate: parseFloat(row.avg_vod_completion_rate.toString()) > 100 ? 100 : parseFloat(row.avg_vod_completion_rate.toString()),
        live_engaged_users_play_time_ratio: parseFloat(row.live_engaged_users_play_time_ratio.toString()) * 100 > 100 ? 100 : parseFloat(row.live_engaged_users_play_time_ratio.toString()) * 100,
        plays_count: {
          live: parseFloat(row.live_plays_count.toString()),
          vod: parseFloat(row.vod_plays_count.toString()),
          total: ReportHelper.numberWithCommas(parseFloat(row.live_plays_count.toString()) + parseFloat(row.vod_plays_count.toString())),
          tooltip: this.getTooltip('plays_count', parseFloat(row.live_plays_count.toString()), parseFloat(row.vod_plays_count.toString()))
        },
        view_period: {
          live: Math.round(parseFloat(row.sum_live_view_period.toString()) * 100) / 100,
          vod: Math.round((parseFloat(row.sum_view_period.toString()) - parseFloat(row.sum_live_view_period.toString())) * 100) / 100 ,
          total: ReportHelper.numberWithCommas(Math.round(parseFloat(row.sum_view_period.toString()) * 100 ) / 100),
          tooltip: this.getTooltip('view_period', Math.round(parseFloat(row.sum_live_view_period.toString()) * 100) / 100, Math.round((parseFloat(row.sum_view_period.toString()) - parseFloat(row.sum_live_view_period.toString())) * 100) / 100)
        }
      })
    });
    setTimeout(() => this._animate = false);
  }

  private getTooltip(metric: string, live: number, vod: number): string {
    let tooltip = '';
    const liveUsers = this._translate.instant('app.entryWebcast.devices.liveUsers', {'0': live});
    const vodUsers = this._translate.instant('app.entryWebcast.devices.vodUsers', {'0': vod});
    if (metric === 'plays_count'){
      tooltip = `<div style="padding: 8px"><div style="display: flex; align-items: center"><div class="circle" style="background-color: #2655b0"></div><span style="font-weight: 700; color: #333333; margin-left: 12px">${liveUsers}</span></div><br><div style="display: flex; align-items: center"><div class="circle" style="background-color: #88acf6"></div><span style="font-weight: 700; color: #333333; margin-left: 12px">${vodUsers}</span></div></div>`;
    }
    if (metric === 'view_period'){
      tooltip = `<div style="padding: 8px"><div style="display: flex; align-items: center"><div class="circle" style="background-color: #d06e1b"></div><span style="font-weight: 700; color: #333333; margin-left: 12px">${liveUsers}</span></div><br><div style="display: flex; align-items: center"><div class="circle" style="background-color: #e1962e"></div><span style="font-weight: 700; color: #333333; margin-left: 12px">${vodUsers}</span></div></div>`;
    }
    return tooltip;
  }

  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    // remove live minutes viewed
    this._tabsData.splice(3, 1);
    // merge plays count of live and VOD
    this._tabsData[0].rawValue = parseFloat(this._tabsData[0].rawValue.toString()) + parseFloat(this._tabsData[1].rawValue.toString());
    // remove live plays count
    this._tabsData.splice(1, 1);
    // switch placed between "Avg. Completion rate" and "Live engagement rate" tabs
    this._tabsData.splice(2, 0, this._tabsData.pop());
    this._selectedTotal = parseFloat(this._tabsData.find(el => el.key === this._selectedMetrics).rawValue.toString());
  }

  public _onTabChange(tab: Tab): void {
    this._animate = true;
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
    this._selectedTotal = parseFloat(this._tabsData.find(el => el.key === this._selectedMetrics).rawValue.toString());
    if (tab.key === 'live_engaged_users_play_time_ratio') {
      this._selectedTotal = this._selectedTotal * 100;
    }
    setTimeout(() => this._animate = false);
  }

}
