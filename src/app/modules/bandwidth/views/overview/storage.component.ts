import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { AuthService, BrowserService, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { StorageDataConfig } from './storage-data.config';
import { ReportDataConfig, ReportDataFields, ReportDataSection } from 'shared/services/storage-data-base.config';
import { map, switchMap } from 'rxjs/operators';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import {tableLocalSortHandler, TableRow} from 'shared/utils/table-local-sort-handler';
import { StorageExportConfig } from './storage-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { OverviewDateRange } from "./overview-date-filter/overview-date-range.type";
import { AnalyticsPermissions } from "shared/analytics-permissions/analytics-permissions";
import { AnalyticsPermissionsService } from "shared/analytics-permissions/analytics-permissions.service";
import { SelectItem, SortEvent } from "primeng/api";
import { fileSize } from "shared/utils/file-size";

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
  public _refineFilterOpened = false;
  public _selectedAccounts: number[] = [];
  public _selectedRefineFilters: RefineFilter = null;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: TableRow<string>[] = [];
  public _tabsData: Tab[] = [];
  public _barChartData: any = {'bandwidth_consumption': []};
  public _showTable = false;
  public _storageViewConfig = analyticsConfig.viewsConfig.bandwidth.overview;
  public _selectedPeriod = '';
  public _multiAccount = false;
  public _reach = false;
  public _metricsOptions: SelectItem[] = [];
  public _fields: ReportDataFields;
  public _colorsMap: { [metric: string]: string } = {};

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _graphTitle = '';

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
  public graphFilter: KalturaEndUserReportInputFilter = null;
  public _sortField = 'month_id';
  private order = '-month_id';
  private _dataConfig: ReportDataConfig = null;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _authService: AuthService,
              private _browserService: BrowserService,
              private _dataConfigService: StorageDataConfig,
              private _logger: KalturaLogger,
              private _permissionsService: AnalyticsPermissionsService,
              private _exportConfigService: StorageExportConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
    this._exportConfig = _exportConfigService.getConfig();
    this._multiAccount = this._permissionsService.hasPermission(AnalyticsPermissions.FEATURE_MULTI_ACCOUNT_ANALYTICS) && analyticsConfig.multiAccount;
    this._reach = this._permissionsService.hasPermission(AnalyticsPermissions.REACH_PLUGIN_PERMISSION)
    this._fields = _dataConfigService.getConfig()[ReportDataSection.graph].fields;
    this._colorsMap = Object.keys(this._fields).reduce((acc, val) => (acc[val] = (this._fields[val].colors && this._fields[val].colors[0]) || '#0f0', acc), {});
    this._metricsOptions = this._getOptions(Object.keys(this._fields));
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
    this.order = this._reportInterval === KalturaReportInterval.years ? '-year_id' : '-month_id';
    this._sortField = this._reportInterval === KalturaReportInterval.years ? 'year_id' : 'month_id';
    this.pager.pageIndex = 1;

    // update graph filter to show previous up to 12 months or 5 years according to selected period
    this.graphFilter = Object.assign(KalturaObjectBaseFactory.createObject(this.filter), this.filter);
    const partnerCreationDate = new Date(this._authService.partnerCreatedAt);

    if (range.interval === KalturaReportInterval.years) {
      // get up to last 5 years
      const partnerCreationYear = partnerCreationDate.getFullYear();
      const selectedYear = new Date(range.startDate * 1000).getFullYear();
      const yearsDiff = selectedYear - partnerCreationYear;
      if (yearsDiff < 5) {
        // partner created less than 5 years since selected year - show data since partner creation till selected year
        this.graphFilter.fromDate = DateFilterUtils.toServerDate(partnerCreationDate, true);
      } else {
        // partner created over 5 years since selected year - show data from 5 years before selected year till selected year
        const startYear = selectedYear - 4;
        this.graphFilter.fromDate = DateFilterUtils.toServerDate(new Date(`${startYear}-01-01`), true);
      }
    } else {
      // get up to last 12 months
      const selectedDate = new Date(range.startDate * 1000);
      const monthsDiff = selectedDate.getMonth() - partnerCreationDate.getMonth() + (12 * (selectedDate.getFullYear() - partnerCreationDate.getFullYear()));
      if (monthsDiff < 12) {
        // partner created less than 12 months since selected month - show data since partner creation till selected month
        this.graphFilter.fromDate = DateFilterUtils.toServerDate(partnerCreationDate, true);
      } else {
        // partner created over 12 months since selected month - show data from 12 months before selected month till selected month
        const selectedDate = new Date(range.startDate * 1000);
        selectedDate.setMonth((selectedDate.getMonth() - 11));
        this.graphFilter.fromDate = DateFilterUtils.toServerDate(selectedDate, true);
      }
    }

    this.loadReport();
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
    if (this._selectedAccounts.length) {
      reportConfig.objectIds = this._selectedAccounts.join(',');
    } else {
      delete reportConfig['objectIds'];
    }
    this._reportService.getReport(reportConfig, { totals: this._dataConfig.totals })
      .pipe(switchMap(report => {
        const graphReportConfig: ReportConfig = { reportType: this.reportType, filter: this.graphFilter, pager: this.pager, order: this.order };
        if (this._selectedAccounts.length) {
          graphReportConfig.objectIds = this._selectedAccounts.join(',');
        } else {
          delete graphReportConfig['objectIds'];
        }
        return this._reportService.getReport(graphReportConfig, { graph: this._dataConfig.graph })
          .pipe(map(graph => ({ report, graph })));
      }))
      .subscribe( ({ report, graph }) => {
          if (graph.graphs.length) {
            this._chartDataLoaded = false;
            this.handleGraphs(graph.graphs); // handle graphs
            this.handleTable(graph);  // table from graph
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

  public _onSortChanged(event: SortEvent) {
    this.order = tableLocalSortHandler(event, this.order);
    if (event.field === "month_id") {
      this._tableData.reverse();
    }
  }

  private handleTable(graph: Report): void {
    const graphs = graph.graphs;
    const { columns, tableData, totalCount } = this._reportService.tableFromGraph(
      graphs,
      this._dataConfig.table,
      this._reportInterval,
    );
    this._columns = columns;
    this._tableData = tableData;
    if (this._tableData.length) {
      this._graphTitle = this._sortField === 'month_id'
        ? this._translate.instant('app.bandwidth.overview.lastMonths', {months: this._tableData.length, selectedPeriod: this._selectedPeriod})
        : this._translate.instant('app.bandwidth.overview.lastYears', {years: this._tableData.length, selectedPeriod: this._selectedPeriod});
    } else {
      this._graphTitle = '';
    }
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
    this._barChartData = barChartData;
    this.updateGraphsColor();
  }

  private updateGraphsColor() {
    Object.keys(this._barChartData).forEach(key => {
      const data: any[] = this._barChartData[key].series[0].data;
      if (data && data.length) {
        const value = data.pop();
        const lastValue = {
          value,
          itemStyle: {
            color: this._dataConfig.graph.fields[key].colors[1]
          }
        }
        data.push(lastValue);
      }
    });
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._selectedAccounts = [];
    event.forEach(account => {
      this._selectedAccounts.push(account.value.id);
    })
    this._updateExportConfig();
    this.loadReport();
  }

  private _updateExportConfig(): void {
    let update: Partial<ExportItem> = { reportType: this.reportType, order: this.order, additionalFilters: {} };
    if (this._selectedAccounts.length) {
      update.objectIds = this._selectedAccounts.join(',');
    } else {
      delete update['objectIds'];
    }
    this._exportConfig = StorageExportConfig.updateConfig(this._exportConfigService.getConfig(), 'overview', update);
  }

  public _navigateToEnrichment(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, '/servicesDashboard');
    }
  }

  public _onMetricChange(metric: string): void {
    this._selectedMetrics = metric;
  }

  private _getOptions(metrics: string[]): SelectItem[] {
    return metrics.map(metric => ({
      label: this._translate.instant(`app.bandwidth.overview.${metric}`),
      value: metric,
    }));
  }

  public getFormattedValue(value: any): string {
    value = parseFloat(value.replace(/,/g, ''));
    return `${ReportHelper.numberOrZero(fileSize(value).value, false)} ${fileSize(value).units}`;
  }

}
