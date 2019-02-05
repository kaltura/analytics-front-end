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

@Component({
  selector: 'app-video-performance',
  templateUrl: './video-performance.component.html',
  styleUrls: ['./video-performance.component.scss'],
  providers: [VideoPerformanceConfig, ReportService]
})
export class VideoPerformanceComponent extends EntryBase {
  @Input() entryId = '';
  @Input() dateFilterComponent: DateFilterComponent;
  
  private _order = '-month_id';
  private _reportType = KalturaReportType.userTopContent;
  private _dataConfig: ReportDataConfig;
  private _metricsCompareTo: string = null;
  
  protected _dateFilter: DateChangeEvent;
  protected _componentId = 'video-performance';
  
  public _columns: string[] = [];
  public _totalCount = 0;
  public _tableData: any[] = [];
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
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  
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
    
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    if (reportConfig['objectIds__null']) {
      delete reportConfig['objectIds__null'];
    }
    reportConfig.objectIds = this.entryId;
    
    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }
        
        const compareReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: this._order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this._handleCompare(report, compare);
          } else {
            if (report.graphs) {
              this._handleGraphs(report.graphs); // handle totals
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
                  this._loadReport();
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
  
  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDay = this._dateFilter.startDay;
    this._filter.toDay = this._dateFilter.endDay;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDay = compare.endDay;
      this._compareFilter.toDay = this._dateFilter.endDay;
    } else {
      this._compareFilter = null;
    }
  }
  
  private _handleCompare(current: Report, compare: Report): void {
    const currentPeriod = { from: this._filter.fromDay, to: this._filter.toDay };
    const comparePeriod = { from: this._compareFilter.fromDay, to: this._compareFilter.toDay };
    
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
  }
  
  private _handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }
  
  private _handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this._filter.fromDay, to: this._filter.toDay },
      this._reportInterval
    );
    this._lineChartData = lineChartData;
    this._parseTableDataFromGraph(lineChartData);
    
    if (this._metricsCompareTo) {
      this._onCompareTo(this._metricsCompareTo);
    }
  }
  
  private _parseTableDataFromGraph(chartData: { [key: string]: any }): void {
    const tableFieldsConfig = this._dataConfig[ReportDataSection.table].fields;
    const dateColumn = this._reportInterval === KalturaReportInterval.months ? 'month_id' : 'date_id';
    this._columns = [dateColumn, ...Object.keys(this._dataConfig[ReportDataSection.totals].fields)];
    this._tableData = chartData[this._selectedMetrics].xAxis.data.map((item, index) =>
      this._columns.reduce((res, col) => {
          res[col] = col === dateColumn
            ? item
            : tableFieldsConfig[col].format(chartData[col].series[0].data[index]);
          
          return res;
        },
        {})
    );
    this._totalCount = this._tableData.length;
  }
  
  public _onTabChange(tab: Tab): void {
    this._selectedMetrics = tab.key;
    this._selectedMetricsLabel = this._translate.instant(`app.entry.${this._selectedMetrics}`);
    this._metricsLineChartData = null;
  }
  
  public _toggleTable(): void {
    this._showTable = !this._showTable;
    setTimeout(() => {
      this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
    }, 0);
  }
  
  public _onPaginationChanged(event: any): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      // this._loadReport({ table: null });
    }
  }
  
  public _onSortChanged(event) {
    if (event.data.length && event.field && event.order && !this._isCompareMode) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        // this._loadReport({ table: null });
      }
    }
  }
  
  public _onCompareTo(field: string): void {
    if (field) {
      this._metricsCompareTo = field;
      this._metricsLineChartData = this._compareService.compareToMetric(
        this._dataConfig.graph,
        this._lineChartData,
        this._selectedMetrics,
        field,
        this._selectedMetricsLabel,
        this._translate.instant(`app.entry.${field}`)
      );
    } else {
      this._metricsLineChartData = null;
      this._metricsCompareTo = null;
    }
  }
}
