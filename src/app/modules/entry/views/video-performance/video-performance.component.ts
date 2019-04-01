import { Component, Input } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportGraph, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { VideoPerformanceConfig } from './video-performance.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { EntryBase } from '../entry-base/entry-base';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { SelectItem } from 'primeng/api';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import { tableLocalSortHandler, TableRow } from 'shared/utils/table-local-sort-handler';
import { SortEvent } from 'primeng/api';
import { analyticsConfig } from 'configuration/analytics-config';

@Component({
  selector: 'app-video-performance',
  templateUrl: './video-performance.component.html',
  styleUrls: ['./video-performance.component.scss'],
  providers: [VideoPerformanceConfig, ReportService]
})
export class VideoPerformanceComponent extends EntryBase {
  @Input() entryId = '';
  @Input() dateFilterComponent: DateFilterComponent;
  
  private _order = '-date_id';
  private _reportType = KalturaReportType.userTopContent;
  private _dataConfig: ReportDataConfig;
  public _metricsCompareTo: string = null;
  
  public _dateFilter: DateChangeEvent;
  protected _componentId = 'video-performance';
  
  public _columns: string[] = [];
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  public _firstTimeLoading = true;
  public _lineChartData: { [key: string]: any } = {};
  public _metricsLineChartData: { [key: string]: any } = null;
  public _selectedMetrics: string;
  public _selectedMetricsLabel: string;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _metricsOptions: SelectItem[] = [];
  public _metricsColors: { [key: string]: string; } = {};
  public _showTable = false;
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _pageSize = analyticsConfig.defaultPageSize;
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public _currentDatePeriod = '';
  public _compareDatePeriod = '';

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: VideoPerformanceConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
    this._selectedMetricsLabel = this._translate.instant(`app.entry.${this._selectedMetrics}`);
    
    const totalsConfig = this._dataConfig[ReportDataSection.totals].fields;
    const graphConfig = this._dataConfig[ReportDataSection.graph].fields;
    Object.keys(totalsConfig).forEach(field => {
      this._metricsOptions.push({
        label: this._translate.instant(`app.entry.${field}`),
        value: field
      });
      
      this._metricsColors[field] = graphConfig[field].colors ? graphConfig[field].colors[0] : null;
    });
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    if (reportConfig['objectIds__null']) {
      delete reportConfig['objectIds__null'];
    }
    reportConfig.objectIds = this.entryId;
  
    sections = { ...sections }; // make local copy
    delete sections[ReportDataSection.table]; // remove table config to prevent table request
    
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig: ReportConfig = { reportType: this._reportType, filter: this._compareFilter, order: this._order };
        if (compareReportConfig['objectIds__null']) {
          delete compareReportConfig['objectIds__null'];
        }
        compareReportConfig.objectIds = this.entryId;
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            if (report.graphs) {
              this._handleGraphs(report.graphs); // handle totals
              this._handleTable(report.graphs); // handle table
            }
            if (report.totals) {
              this._handleTotals(report.totals); // handle totals
            }
          }
          this._isBusy = false;
          this._firstTimeLoading = false;
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
  
  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._order = this._reportInterval === KalturaReportInterval.days ? '-date_id' : '-month_id';
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDate, to: this._filter.toDate };
    const comparePeriod = { from: this._compareFilter.fromDate, to: this._compareFilter.toDate };

    if (current.totals) {
      this._handleTotals(current.totals); // handle totals
    }
    
    if (current.graphs.length && compare.graphs.length) {
      const { lineChartData } = this._compareService.compareGraphData(
        currentPeriod,
        comparePeriod,
        current.graphs,
        compare.graphs,
        this._dataConfig.graph,
        this._reportInterval,
      );
      this._lineChartData = lineChartData;
  
      if (this._metricsCompareTo) {
        this._onCompareTo(this._metricsCompareTo);
      }
    }
  
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
  
  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }
  
  private _handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this._filter.fromDate, to: this._filter.toDate },
      this._reportInterval
    );
    this._lineChartData = lineChartData;
    if (this._metricsCompareTo) {
      this._onCompareTo(this._metricsCompareTo);
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

  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
    this._selectedMetricsLabel = this._translate.instant(`app.entry.${this._selectedMetrics}`);
    this._metricsLineChartData = null;
  }
  
  public _toggleTable(): void {
    this._showTable = !this._showTable;
    this.updateLayout();
  }
  
  public _onSortChanged(event: SortEvent) {
    this._order = tableLocalSortHandler(event, this._order, this._isCompareMode);
  }
  
  public _onCompareTo(field: string): void {
    if (field) {
      this._metricsCompareTo = field;
      this._currentDatePeriod = this._compareFilter ? DateFilterUtils.getMomentDate(this._filter.fromDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._filter.toDate).format('MMM D, YYYY') : '';
      this._compareDatePeriod = this._compareFilter ? DateFilterUtils.getMomentDate(this._compareFilter.fromDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._compareFilter.toDate).format('MMM D, YYYY') : '';
      this._metricsLineChartData = this._compareService.compareToMetric(
        this._dataConfig.graph,
        this._lineChartData,
        this._selectedMetrics,
        field,
        this._selectedMetricsLabel,
        this._translate.instant(`app.entry.${field}`),
        this._currentDatePeriod,
        this._compareDatePeriod
      );
    } else {
      this._metricsLineChartData = null;
      this._metricsCompareTo = null;
    }
  }

  public onPaginationChange(event): void {
    this.updateLayout();
  }

  private updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
      }, 0);
    }
  }
}
