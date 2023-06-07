import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BaseEntryGetAction, KalturaClient, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMediaEntry, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { forkJoin, Observable } from 'rxjs';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { SessionConfig } from './session.config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { getPrimaryColor, getSecondaryColor } from "shared/utils/colors";
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import { of } from 'rxjs';

export enum ViewerTabs {
  viewer = 'viewer',
  stage = 'stage',
}

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
export class EpSessionComponent implements OnInit, OnDestroy {
  @Input() recordingEntryId = '';
  @Input() entryIdIn = '';
  @Input() actualStartDate: Date; // session actual start date
  @Input() startDate: Date; // session start date rounded down the the last half hour
  @Input() endDate: Date;

  private _order = '-date_id';
  private _reportType = KalturaReportType.epWebcastEngagementTimeline;
  private _dataConfig: ReportDataConfig;

  public _reportTabs = ViewerTabs;
  public _currentTab = ViewerTabs.viewer;

  public _duration = 0;
  private _timerIntervalId = null;
  private _tickPercentIncrease = 0;
  public _currentPositionPercent = 0;
  public _currentPosition = '';
  public _playing = false;

  public _chartOptions = {};
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage = null;
  public _durationLabel = '';
  public _reportData: any[] = [];

  // player and recording
  private _playerInstance: any = null;
  public serverUri = getKalturaServerUri();
  public _playerConfig: any = {};
  private _recordingDuration = 0;
  public _recordingAvailable = false;
  public _recordingPlaying = false;
  public _recordingStartPercent = 0;
  public _recordingEndPercent = 0;

  public _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  constructor(private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: SessionConfig,
              private _kalturaClient: KalturaClient,
              private _authService: AuthService,
              private _logger: KalturaLogger) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
    this._duration = this.endDate.getTime() - this.actualStartDate.getTime(); // use actual session start date for duration calculation
    this._durationLabel = ReportHelper.time(this._duration.toString());
    this._tickPercentIncrease = 100000 / this._duration;

    // init player
    this._playerConfig = {
      uiconfid: analyticsConfig.kalturaServer.previewUIConfV7,
      pid: this._authService.pid,
      ks: this._authService.ks
    };

    this._loadReport();
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.entryIdIn = this.entryIdIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset(),
    this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;

    const recording = this.recordingEntryId.length ? this._kalturaClient.request(new BaseEntryGetAction({ entryId: this.recordingEntryId })).pipe(cancelOnDestroy(this)) : of(false);
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this._order };
    const report = this._reportService.getReport(reportConfig, sections, false);
    forkJoin({recording, report})
      .subscribe(({ recording, report }) => {
          if (report.table && report.table.header && report.table.data) {
            const { tableData } = this._reportService.parseTableData(report.table, this._dataConfig[ReportDataSection.table]);
            const startTime = this.actualStartDate.getTime() / 1000;
            this._reportData = tableData.filter(dataPoint => parseInt(dataPoint.position) >= startTime); // filter out points earlier than the actual session start date
            const yAxisData1 = this._getAxisData(this._reportData, 'combined_live_view_period_count');
            const yAxisData2 = this._getAxisData(this._reportData, 'combined_live_engaged_users_ratio');
            this._chartOptions = this._getGraphData(yAxisData1, yAxisData2);
          } else {
            const emptyLine = Array.from({ length: 100 }, () => 0);
            this._chartOptions = this._getGraphData(emptyLine, emptyLine);
          }
          if (recording) {
            this._recordingDuration = (recording as KalturaMediaEntry).duration;
            const recordingStart = (recording as KalturaMediaEntry).createdAt;
            const recordingEnd = recordingStart + this._recordingDuration;
            const sessionStart = this.actualStartDate.getTime() / 1000;
            const sessionEnd = this.endDate.getTime() / 1000;
            this._recordingStartPercent = (recordingStart - sessionStart) / (sessionEnd - sessionStart) * 100;
            this._recordingEndPercent = (recordingEnd - sessionStart) / (sessionEnd - sessionStart) * 100;
            this.updateRecording();
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
    this._currentPositionPercent = event.offsetX / event.currentTarget.clientWidth * 100;
    this._currentPosition = ReportHelper.time((this._duration * event.offsetX / event.currentTarget.clientWidth).toString(), true);
    this.updateRecording();
    // calculate the recording position and seek to it
    if (this._recordingAvailable) {
      const recordingPositionPercent = (this._currentPositionPercent - this._recordingStartPercent) / (this._recordingEndPercent - this._recordingStartPercent) * 100;
      if (recordingPositionPercent >= 0 && recordingPositionPercent <= 100) {
        this._seekTo(recordingPositionPercent);
      }
    }
  }

  private updateRecording(): void {
    this._currentPosition = ReportHelper.time((this._duration * this._currentPositionPercent / 100).toString(), true);
    this._recordingAvailable = this._currentPositionPercent >= this._recordingStartPercent && this._currentPositionPercent <= this._recordingEndPercent;
    if (this._recordingAvailable && !this._recordingPlaying && this._playerInstance && this._playing) {
      this._playerInstance.play();
      this._recordingPlaying = true;
    }
    if (!this._recordingAvailable && this._playerInstance) {
      this._playerInstance.pause();
      this._seekTo(0);
      this._recordingPlaying = false;
    }
  }

  private tick(): void {
    this._currentPositionPercent += this._tickPercentIncrease;
    this.updateRecording();
  }

  public togglePlay(): void {
    this._playing = !this._playing;
    if (this._playing && this._timerIntervalId === null) {
      this._timerIntervalId = setInterval(this.tick.bind(this) , 1000);
    } else {
      clearInterval(this._timerIntervalId);
      this._timerIntervalId = null;
    }
    if (this._recordingAvailable) {
      if (this._playing) {
        this._playerInstance.play();
        this._recordingPlaying = true;
      } else {
        this._playerInstance.pause();
        this._recordingPlaying = false;
      }
    }
  }

  public _onPlayerReady(player): void {
    this._playerInstance = player;
  }

  private _seekTo(percent: number): void {
    this._playerInstance.currentTime = this._recordingDuration * percent / 100;
  }

  public _selectTab(tab: ViewerTabs): void {
    this._currentTab = tab;
  }

  ngOnDestroy(): void {
    if (this._timerIntervalId) {
      clearInterval(this._timerIntervalId);
      this._timerIntervalId = null;
    }
  }

}
