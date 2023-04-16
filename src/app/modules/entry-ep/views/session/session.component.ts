import {Component, Input, OnInit} from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {AuthService, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService} from 'shared/services';
import { switchMap } from 'rxjs/operators';
import { of as ObservableOf, Subject } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import {ReportDataConfig, ReportDataSection} from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { SessionConfig } from './session.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {getPrimaryColor, getSecondaryColor} from "shared/utils/colors";

@Component({
  selector: 'app-ep-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss'],
  providers: [
    KalturaLogger.createLogger('EpSessionComponent'),
    SessionConfig,
    ReportService
  ],
})
export class EpSessionComponent implements OnInit {
  @Input() entryIdIn = '';
  @Input() startDate: Date;
  @Input() endDate: Date;

  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastEngagementTimeline;
  private _dataConfig: ReportDataConfig;
  private _duration = 0;

  public _chartOptions = {};
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage = null;
  public _durationLabel = '';
  public _pager = new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: SessionConfig,
              private _logger: KalturaLogger) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
    this._duration = this.endDate.getTime() - this.startDate.getTime();
    this._durationLabel = ReportHelper.time(this._duration.toString());
    this._loadReport();
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = DateFilterUtils.toServerDate(this.startDate, true);
    this._filter.toDate = DateFilterUtils.toServerDate(this.endDate, false);
    this._filter.interval = KalturaReportInterval.days;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      }))
      .subscribe(({ report, compare }) => {
          if (report.table && report.table.header && report.table.data) {
            const { tableData } = this._reportService.parseTableData(report.table, this._dataConfig[ReportDataSection.table]);
            const yAxisData1 = this._getAxisData(tableData, 'combined_live_view_period_count');
            const yAxisData2 = this._getAxisData(tableData, 'combined_live_engaged_users_ratio');
            this._chartOptions = this._getGraphData(yAxisData1, yAxisData2);
          } else {
            const emptyLine = Array.from({ length: 100 }, () => 0);
            this._chartOptions = this._getGraphData(emptyLine, emptyLine);
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

  private _getAxisData(tableData: TableRow[], key: string): number[] {
    const result = tableData.map(item => Number(item[key] || 0));
    return result;
  }

  private _getGraphData(yData1: number[], yData2: number[]) {
    let graphData = {
      color: [getPrimaryColor(), getSecondaryColor()],
      backgroundColor: '#333333',
      grid: {
        left: 0,
        right: 0,
        top: 18,
        bottom: 1
      },
      tooltip: {
        confine: true,
        formatter: params => {
          const { value: value1, dataIndex } = params[0];
          const value2 = params[1].value;
          const progressValue = ReportHelper.time((dataIndex / (yData1.length -1) * this._duration).toString()); // empirically found formula, closest result to expected so far
          let tooltip = `
            <div class="kEntryGraphTooltip">
              <div class="kCurrentTime">${progressValue}</div>
              <div class="kValue">
                <span class="kBullet" style="color: ${getPrimaryColor()}">&bull;</span>
                ${this._translate.instant('app.entryEp.session.viewers')}:&nbsp;${value1}
              </div>
              <div class="kValue">
                <span class="kBullet" style="color: ${getPrimaryColor('viewers')}">&bull;</span>
                ${this._translate.instant('app.entryEp.session.engagement')}:&nbsp;${value2}
              </div>
            </div>
          `;
          return tooltip;
        },
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        padding: 8,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#333333',
          fontWeight: 'bold'
        },
        axisPointer: {
          lineStyle: {
            color: '#ffffff'
          },
          z: 1
        }
      },
      xAxis: {
        show: false,
        boundaryGap: false,
        type: 'category',
        data: Array.from({ length: yData1.length }, (_, i) => i + 1),
      },
      yAxis: [{
        zlevel: 0,
        type: 'value',
        position: 'left',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          inside: true,
          margin: 4,
          fontWeight: 'bold',
          verticalAlign: 'top',
          padding: [8, 0, 0, 0],
          color: '#FFFFFF'
        }
      },{
        zlevel: 0,
        type: 'value',
        position: 'right',
        min: 0,
        max: 100,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#535353'
          }
        },
        axisLabel: {
          formatter: '{value}%',
          inside: true,
          margin: 4,
          fontWeight: 'bold',
          verticalAlign: 'top',
          padding: [8, 0, 0, 0],
          color: '#FFFFFF'
        }
      }],
      series: [
        {
          data: yData1,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          type: 'line',
          lineStyle: {
            color: '#487adf',
            width: 2
          }
        },
        {
          data: yData2,
          symbol: 'circle',
          symbolSize: 4,
          yAxisIndex: 1,
          showSymbol: false,
          type: 'line',
          lineStyle: {
            color: '#1b8271',
            width: 2
          }
        }]
    };
    return graphData;
  }

  public _onChartClick(event): void {
    const percent = event.offsetX / event.currentTarget.clientWidth;
    // this._seekTo(percent, true);
  }

}
