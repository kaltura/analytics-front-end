import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {DateChangeEvent, DateRanges, DateRangeType} from 'shared/components/date-filter/date-filter.service';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInputFilter, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { PublisherStorageDataConfig } from './publisher-storage-data.config';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { of as ObservableOf } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CompareService } from 'shared/services/compare.service';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import { tableLocalSortHandler, TableRow } from 'shared/utils/table-local-sort-handler';
import { SortEvent } from 'primeng/api';
import { PublisherExportConfig } from './publisher-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './publisher-storage.component.html',
  styleUrls: ['./publisher-storage.component.scss'],
  providers: [
    PublisherExportConfig,
    KalturaLogger.createLogger('PublisherStorageComponent'),
    PublisherStorageDataConfig,
  ]
})
export class PublisherStorageComponent implements OnInit {
  private _dataConfig: ReportDataConfig;
  
  public _refineFilter: RefineFilter = null;
  public _selectedRefineFilters: RefineFilter = null;
  public _refineFilterOpened = false;
  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _selectedMetrics: string;
  public _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  public _chartDataLoaded = false;
  public _tableData: TableRow<string>[] = [];
  public _tabsData: Tab[] = [];
  public _showTable = false;
  public _chartType = 'line';
  public _lineChartData: any = {'bandwidth_consumption': {}};
  public _barChartData: any = {'bandwidth_consumption': {}};
  public _dateRange = DateRanges.CurrentQuarter;

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _columns: string[] = [];
  public _totalCount: number;

  public _accumulativeStorage: any[] = [];
  
  public _pageSize = analyticsConfig.defaultPageSize;
  public reportType: KalturaReportType = KalturaReportType.partnerUsage;
  public _exportConfig: ExportItem[] = [];
  public _dateFilter: DateChangeEvent;
  public compareFilter: KalturaReportInputFilter = null;
  public filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private _order = '-date_id';

  public get isCompareMode(): boolean {
    return this.compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _authService: AuthService,
              private _dataConfigService: PublisherStorageDataConfig,
              private _logger: KalturaLogger,
              private _exportConfigService: PublisherExportConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
    this._exportConfig = _exportConfigService.getConfig();
  }

  ngOnInit() {
    this._isBusy = false;
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
    this._logger.trace('Handle date filter change action by user', () => ({ event }));
    this._chartDataLoaded = false;
    this.filter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDate = event.startDate;
    this.filter.toDate = event.endDate;
    this.filter.interval = event.timeUnits;
    this._reportInterval = event.timeUnits;
    this._order = this._reportInterval === KalturaReportInterval.days ? '-date_id' : '-month_id';
    if (event.compare.active) {
      const compare = event.compare;
      this.compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this.filter), this.filter);
      this.compareFilter.fromDate = compare.startDate;
      this.compareFilter.toDate = compare.endDate;
    } else {
      this.compareFilter = null;
    }
    this.loadReport();
  }

  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
    this.updateChartType();
  }
  
  public _onSortChanged(event: SortEvent): void {
    this._logger.trace('Handle local sort changed action by user', { field: event.field, order: event.order });
    this._order = tableLocalSortHandler(event, this._order, this.isCompareMode);
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
  
    sections = { ...sections }; // make local copy
    delete sections[ReportDataSection.table]; // remove table config to prevent table request

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, order: this._order };
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this.reportType, filter: this.compareFilter, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this.handleCompare(report, compare);
          } else {
            if (report.graphs.length) {
              this._chartDataLoaded = false;
              this.handleGraphs(report.graphs); // handle graphs
              this._handleTable(report.graphs);
            }
            if (report.totals) {
              this.handleTotals(report.totals); // handle totals
            }
          }
          this.updateChartType();
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

   private handleCompare(current: Report, compare: Report): void {
     const currentPeriod = { from: this.filter.fromDate, to: this.filter.toDate };
     const comparePeriod = { from: this.compareFilter.fromDate, to: this.compareFilter.toDate };

     if (current.totals && compare.totals) {
       this._tabsData = this._compareService.compareTotalsData(
         currentPeriod,
         comparePeriod,
         current.totals,
         compare.totals,
         this._dataConfig.totals,
         this._selectedMetrics
       );
       this._accumulativeStorage = this._compareService.compareTotalsData(
         currentPeriod,
         comparePeriod,
         current.totals,
         compare.totals,
         this._dataConfig.accumulative,
         this._selectedMetrics
       );
     }

     if (current.graphs.length && compare.graphs.length) {
       const { lineChartData, barChartData } = this._compareService.compareGraphData(
         currentPeriod,
         comparePeriod,
         current.graphs,
         compare.graphs,
         this._dataConfig.graph,
         this._reportInterval,
         () => this._chartDataLoaded = true
       );
       this._lineChartData = lineChartData;
       this._barChartData = barChartData;
  
       const compareTableData = this._compareService.compareTableFromGraph(
         currentPeriod,
         comparePeriod,
         current.graphs,
         compare.graphs,
         this._dataConfig.table,
         this._reportInterval,
       );
  
       if (compareTableData) {
         const { columns, tableData, totalCount } = compareTableData;
         this._totalCount = totalCount;
         this._columns = columns;
         this._tableData = tableData;
       }
     }
   }
  
  private _handleTable(graphs: KalturaReportGraph[]): void {
    const { columns, tableData, totalCount } = this._reportService.tableFromGraph(
      graphs,
      this._dataConfig.table,
      this._reportInterval,
    );
    this._totalCount = totalCount;
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
      { from: this.filter.fromDate, to: this.filter.toDate },
      this._reportInterval,
      () => this._chartDataLoaded = true
    );
    this._lineChartData = lineChartData;
    this._barChartData = barChartData;
  }

  private updateChartType(): void {
    this._chartType = ((this._selectedMetrics === 'added_storage' || this._selectedMetrics === 'deleted_storage') && this._reportInterval === KalturaReportInterval.months) ? 'bar' : 'line';
  }
  
  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;

    refineFilterToServerValue(this._refineFilter, this.filter);
    if (this.compareFilter) {
      refineFilterToServerValue(this._refineFilter, this.compareFilter);
    }
  
    this.loadReport();
  }
}
