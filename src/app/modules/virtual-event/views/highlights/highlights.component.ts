import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {ErrorsManagerService, Report, ReportService} from 'shared/services';
import {KalturaAPIException, KalturaEndUserReportInputFilter, KalturaReportGraph, KalturaReportInterval, KalturaReportTotal} from 'kaltura-ngx-client';
import {BehaviorSubject} from 'rxjs';
import {ReportDataConfig} from 'shared/services/storage-data-base.config';
import {HighlightsDataConfig} from './highlights-data.config';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {DateChangeEvent} from 'shared/components/date-filter/date-filter.service';
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {Tab} from "shared/components/report-tabs/report-tabs.component";
import {isEmptyObject} from "shared/utils/is-empty-object";
import {TranslateService} from "@ngx-translate/core";
import {tableLocalSortHandler, TableRow} from "shared/utils/table-local-sort-handler";
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import {SortEvent} from "primeng/api";

@Component({
  selector: 'app-ve-highlights',
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss'],
  providers: [
    KalturaLogger.createLogger('VEHighlightsComponent'),
    HighlightsDataConfig,
    ReportService,
  ],
})
export class HighlightsComponent implements OnInit, OnDestroy {
  private _dateFilter: DateChangeEvent;
  private _componentId = 'highlights';
  private order = '-date_id';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _lineChartData = {};
  public _tabsData: Tab[] = [];
  public _selectedMetrics: string;
  public _tableData: TableRow<string>[] = [];
  public _showTable = false;
  public _sortField = 'date_id';
  public _columns: string[] = [];

  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      this._dateFilter = value;
      if (!this._dateFilter.applyIn || this._dateFilter.applyIn.indexOf(this._componentId) !== -1) {
        this._updateFilter();
      }
    }
  }

  @Input() highlights$: BehaviorSubject<{ current: Report, busy: boolean, error: KalturaAPIException }>;

  private filter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  private _dataConfig: ReportDataConfig;

  constructor(private _errorsManager: ErrorsManagerService,
              private _frameEventManager: FrameEventManagerService,
              private _reportService: ReportService,
              private _logger: KalturaLogger,
              private _translate: TranslateService,
              private _dataConfigService: HighlightsDataConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }

  ngOnInit() {
    if (this.highlights$) {
      this.highlights$
        .pipe(cancelOnDestroy(this))
        .subscribe(({ current, busy, error }) => {
          this._isBusy = busy;
          this._blockerMessage = this._errorsManager.getErrorMessage(error, { 'close': () => { this._blockerMessage = null; } });
          if (current && current.totals) {
            this.handleTotals(current.totals);
          }
          if (current && current.graphs) {
            this.handleGraphs(current.graphs);
            this.handleTable(current);  // table from graph
          }
        });
    }
  }

  ngOnDestroy(): void {
  }

  private handleTotals(totals: KalturaReportTotal): void {
    this._tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    let { lineChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this.filter.fromDate, to: this.filter.toDate },
      this._reportInterval
    );
    // ------- Mock data for tests ----  //
    // Object.keys(lineChartData).forEach(key => {
    //   const arr = Array.from([1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], x => Math.round(x*Math.random()*100));
    //   (lineChartData[key] as any).series[0].data = arr;
    // });
    // ------- Mock data end ----  //

    // mark peak days
    Object.keys(lineChartData).forEach(key => {
      // display peak day label only if we have at least one value larger than 0
      if (Math.max(...(lineChartData[key] as any).series[0].data) > 0) {
        (lineChartData[key] as any).series[0].markPoint = {
          symbolSize: 44,
          label: {
            padding: 8,
            offset: [0, -4],
            fontFamily: 'Lato',
            fontSize: 14,
            fontWeight: 'bold',
            borderRadius: 4,
            backgroundColor: '#006EFA',
            color: '#ffffff',
            formatter: this._translate.instant('app.ve.peak')
          },
          data: [
            {type: 'max', name: 'Max'}
          ]
        };
        (lineChartData[key] as any).grid = {
          bottom: 24,
          containLabel: true,
          left: 24,
          right: 24,
          top: 60,
        };
      }
    });
    this._lineChartData = !isEmptyObject(lineChartData) ? lineChartData : null;
  }

  private handleTable(graph: Report): void {
    const graphs = graph.graphs;
    const { columns, tableData } = this._reportService.tableFromGraph(graphs, this._dataConfig.table, this._reportInterval);
    this._columns = columns;
    this._tableData = tableData;

    // ------- Mock data for tests ----  //
    // for (let i=1; i<columns.length; i++) {
    //   this._tableData.forEach((data: any) => {
    //     data[columns[i]] = Math.round(Math.random() * 100);
    //   });
    // }
    // ------- Mock data end ----  //

  }

  public _onTabChange(tab: Tab): void {
    this._logger.trace('Handle tab change action by user', { tab });
    this._selectedMetrics = tab.key;
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

  public _onSortChanged(event: SortEvent) {
    this.order = tableLocalSortHandler(event, this.order);
    this._tableData.reverse();
  }

  private _updateFilter(): void {
    this.filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this.filter.fromDate = this._dateFilter.startDate;
    this.filter.toDate = this._dateFilter.endDate;
    this.filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
  }
}
