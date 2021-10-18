import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { AuthService, BrowserService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportTotal, KalturaReportType, KalturaUser } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { UsersFilterComponent } from 'shared/components/users-filter/users-filter.component';
import { StorageDataConfig } from './storage-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf, Subject } from 'rxjs';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { StorageExportConfig } from './storage-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { GeoExportConfig } from '../../../audience/views/geo-location/geo-export.config';
import { reportTypeMap } from 'shared/utils/report-type-map';
import {DateFilterUtils, DateRanges} from "shared/components/date-filter/date-filter-utils";
import {OverviewDateRange} from "./overview-date-filter/overview-date-range.type";

@Component({
  selector: 'app-storage',
  templateUrl: './storage.component.html',
  styleUrls: ['./storage.component.scss'],
  providers: [
    StorageExportConfig,
    KalturaLogger.createLogger('StorageComponent'),
    StorageDataConfig,
  ]
})
export class StorageComponent implements OnInit {

  @ViewChild('userFilter') private userFilter: UsersFilterComponent;

  public _refineFilterOpened = false;
  public _refineFilter: RefineFilter = null;
  public _selectedRefineFilters: RefineFilter = null;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: TableRow<string>[] = [];
  public _tabsData: Tab[] = [];
  public _lineChartData: any = {'bandwidth_consumption': []};
  public _barChartData: any = {'bandwidth_consumption': []};
  public _chartType = 'line';
  public _showTable = false;
  public _totalCount: number;
  public _storageViewConfig = analyticsConfig.viewsConfig.bandwidth.overview;
  public _selectedPeriod = '';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _drillDown = '';

  public pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  public reportType: KalturaReportType = reportTypeMap(KalturaReportType.selfServeUsage);
  public _exportConfig: ExportItem[] = [];
  public _dateFilter: DateChangeEvent;
  public filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private order = '-total_storage_mb';
  private _dataConfig: ReportDataConfig = null;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _browserService: BrowserService,
              private _dataConfigService: StorageDataConfig,
              private _logger: KalturaLogger,
              private _exportConfigService: StorageExportConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
    this._exportConfig = _exportConfigService.getConfig();
  }

  ngOnInit() {
    this._isBusy = false;
  }

  public _onDateFilterChange(range: OverviewDateRange): void {
    const event = {} as DateChangeEvent;
    this._dateFilter = event;
    this._chartDataLoaded = false;
    this.filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this.filter.toDate = range.endDate;
    this.filter.fromDate = range.startDate;
    this.filter.interval = range.interval;
    this._reportInterval = range.interval;
    this._selectedPeriod = range.label;
    this.order = this._reportInterval === KalturaReportInterval.months ? '-year_id' : '-month_id';
    this.pager.pageIndex = 1;
    this.loadReport();
  }

  private _updateExportConfig(): void {
    let update: Partial<ExportItem> = { reportType: this.reportType, order: this.order, additionalFilters: {} };

    if (this._drillDown) {
      update.additionalFilters.userIds = this._drillDown;
    }

    this._exportConfig = GeoExportConfig.updateConfig(this._exportConfigService.getConfig(), 'end-user', update);
  }

  public toggleTable(): void {
    this._logger.trace('Handle toggle table visibility action by user', { tableVisible: !this._showTable });
    this._showTable = !this._showTable;
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        const height = document.getElementById('analyticsApp').getBoundingClientRect().height;
        this._logger.trace('Send update layout event to the host app', { height });
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height });
      }, 0);
    }
  }

  private loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
          return ObservableOf({ report });
      }))
      .subscribe( ({ report }) => {
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
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this.loadReport();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  _onSortChanged(event) {
    setTimeout(() => {
      if (event.data.length && event.field && event.order && event.order !== 1) {
        const order = (event.order === 1 || event.field === 'month_id') ? '+' + event.field : '-' + event.field;
        if (order !== this.order) {
          this._logger.trace('Handle sort changed action by user', { order });
          this.order = order;
          this.pager.pageIndex = 1;
          this.loadReport({ table: this._dataConfig.table });
        }
      }
    });
  }

  private handleTable(table: KalturaReportTable): void {
    const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    this._totalCount = table.totalCount;
    if (columns.indexOf('partner_id') > -1) {
      columns.splice(columns.indexOf('partner_id'), 1);
    }
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
      { from: this.filter.fromDate, to: this.filter.toDate },
      this._reportInterval,
      () => this._chartDataLoaded = true
    );
    this._lineChartData = lineChartData;
    this._barChartData = barChartData;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
    refineFilterToServerValue(this._refineFilter, this.filter);
    this.loadReport();
  }

  public _navigateToEnrichment(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, '/settings/reach/list');
    }
  }
}
