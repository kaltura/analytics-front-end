import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {ErrorsManagerService, Report, ReportConfig, ReportService} from 'shared/services';
import {
  KalturaAPIException,
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaReportGraph,
  KalturaReportInterval,
  KalturaReportType
} from 'kaltura-ngx-client';
import {switchMap} from 'rxjs/operators';
import {BehaviorSubject, of as ObservableOf} from 'rxjs';
import {ReportDataConfig, ReportDataSection} from 'shared/services/storage-data-base.config';
import {StatusDataConfig} from './status-data.config';
import {TranslateService} from '@ngx-translate/core';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {DateChangeEvent} from 'shared/components/date-filter/date-filter.service';
import {RefineFilter} from 'shared/components/filter/filter.component';
import {refineFilterToServerValue} from 'shared/components/filter/filter-to-server-value.util';
import {reportTypeMap} from 'shared/utils/report-type-map';
import {getColorPalette} from "shared/utils/colors";
import {EChartOption} from "echarts";

@Component({
  selector: 'app-ve-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss'],
  providers: [
    KalturaLogger.createLogger('VEStatusComponent'),
    StatusDataConfig,
    ReportService,
  ],
})
export class StatusComponent implements OnInit, OnDestroy {
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      this._dateFilter = value;

      if (!this._dateFilter.applyIn || this._dateFilter.applyIn.indexOf(this._componentId) !== -1) {
        this._updateFilter();
        // load report in the next run cycle to be sure all properties are updated
        setTimeout(() => {
          this._loadReport();
        });
      }
    }
  }

  @Input() set refineFilter(value: RefineFilter) {
    if (value) {
      this._refineFilter = value;
      this._updateRefineFilter();
      // load report in the next run cycle to be sure all properties are updated
      setTimeout(() => {
        this._loadReport();
      });
    }
  }

  @Input() virtualEventId: string;

  private _dateFilter: DateChangeEvent;
  private _refineFilter: RefineFilter = [];

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _chartLoaded = false;
  public _chartData: EChartOption = {};

  public status$ = new BehaviorSubject<{ current: Report, busy: boolean, error: KalturaAPIException }>({ current: null, busy: false, error: null });

  private _componentId = 'status';
  private echartsIntance: any;

  private reportType: KalturaReportType = reportTypeMap(KalturaReportType.veUserHighlights);
  private pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private order = 'registered';
  private filter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  private _dataConfig: ReportDataConfig;

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _dataConfigService: StatusDataConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._chartData = _dataConfigService.getChartConfig();
  }

  ngOnInit() {
    this._isBusy = false;
  }

  ngOnDestroy(): void {
    this.status$.complete();
  }

  private _loadReport(): void {
    this.status$.next({ current: null, busy: true, error: null });
    this._isBusy = true;
    this._chartLoaded = false;
    this._blockerMessage = null;

    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };

    if (this.virtualEventId) {
      reportConfig.filter.virtualEventIdIn = this.virtualEventId;
    }
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
          return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          this.status$.next({ current: report, busy: false, error: null });
          // if (report.graphs) {
          //   this.handleGraphs(report.graphs); // handle graphs
          // }
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
          this.status$.next({ current: null, busy: false, error: error });
        });
  }

  private handleGraphs(graphs: KalturaReportGraph[]): void {
    const { lineChartData, barChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this.filter.fromDate, to: this.filter.toDate },
      this._reportInterval,
      () => this._chartLoaded = true
    );
    // update xAxis data (dates)
    const fields = this._dataConfig[ReportDataSection.graph].fields;
    const xAxisData = (barChartData[Object.keys(fields)[0]] as any).xAxis.data;
    this._setEchartsOption({'xAxis': { data: xAxisData}});
    // update all series
    let series = [];
    const colors = [getColorPalette()[0], getColorPalette()[2], getColorPalette()[4], getColorPalette()[7]];
    Object.keys(fields).forEach((key, index) => {
      const data = (barChartData[key] as any).series[0].data; // [3,6,1,9,4,7,3,7,12,3,12,5,3,11,8,2,4,2,7];
      series.push({
        name: key,
        type: 'bar',
        stack: 'total',
        itemStyle: {color:  colors[index]},
        data
      });
    });
    series = series.reverse();
    this._setEchartsOption({series});
    this._setEchartsOption({"legend" : { "data": Object.keys(fields) }});
  }

  private _setEchartsOption(option: EChartOption, opts?: any): void {
    setTimeout(() => {
      if (this.echartsIntance) {
        this.echartsIntance.setOption(option, opts);
      }
    }, 200);
  }

  private _updateFilter(): void {
    this.filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this.filter.fromDate = this._dateFilter.startDate;
    this.filter.toDate = this._dateFilter.endDate;
    this.filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this.pager.pageIndex = 1;
  }

  private _updateRefineFilter(): void {
    this.pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this.filter);
  }

  public onChartInit(ec) {
    this.echartsIntance = ec;
  }
}
