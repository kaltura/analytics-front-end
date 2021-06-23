import { Component, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, Report, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { EntryPreviewConfig } from './entry-preview.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { KalturaPlayerComponent } from 'shared/player';
import { WebcastBaseReportComponent } from '../webcast-base-report/webcast-base-report.component';
import {getPrimaryColor, getSecondaryColor} from 'shared/utils/colors';
import {switchMap} from "rxjs/operators";
import {forkJoin, of as ObservableOf} from "rxjs";
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-webcast-entry-preview',
  templateUrl: './entry-preview.component.html',
  styleUrls: ['./entry-preview.component.scss'],
  providers: [EntryPreviewConfig, ReportService]
})
export class WebcastEntryPreviewComponent extends WebcastBaseReportComponent implements OnInit {
  @Input() entryId = '';
  @Input() liveEntryId = '';
  @Input() broadcastStartTime: number;
  @Input() broadcastEndTime: number;
  @Input() isLive = false;

  private _dataConfig: ReportDataConfig;
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _playerInstance: any = null;
  private _playerInitialized = false;
  private _reportType = reportTypeMap(KalturaReportType.percentiles);
  private _liveReportType = reportTypeMap(KalturaReportType.engagmentTimelineWebcast);

  public _dateFilter: DateChangeEvent;
  protected _componentId = 'preview';

  public _currentDatePeriodLabel: string = null;
  public _compareDatePeriodLabel: string = null;
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _liveFilter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _playerConfig: any = {};
  public serverUri = getKalturaServerUri();
  public _playerPlayed = false;
  public _playProgress = 0;
  public _duration = 0;
  public _currentTime = 0;

  public _chartOptions = {};

  @ViewChild('player') player: KalturaPlayerComponent;

  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private zone: NgZone,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: EntryPreviewConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit() {
    if (this.entryId.length) {
      this._initPlayer();
    }
  }

  private _getGraphData(yData1: number[], yData2: number[], pointsCount: number = 101) {
    // TODO - handle secondary yAxis by percentage
    let graphData = {
      color: [getPrimaryColor(), getSecondaryColor()],
      backgroundColor: '#333333',
      grid: {
        left: 0,
        right: 0,
        top: 18,
        bottom: 0
      },
      xAxis: {
        show: false,
        boundaryGap: false,
        type: 'category',
        data: Array.from({ length: pointsCount }, (_, i) => i),
      },
      tooltip: {
        confine: true,
        formatter: params => {
          const { value: value1, dataIndex } = params[0];
          const value2 = params[1] !== null && params[1] !== undefined ? params[1].value.toFixed(2) + '%' : this._translate.instant('app.common.na');
          const progressValue = ReportHelper.time(String(dataIndex / (pointsCount -1) * this._duration)); // empirically found formula, closest result to expected so far
          let tooltip = `
            <div class="kEntryGraphTooltip">
              <div class="kCurrentTime">${progressValue}</div>
              <div class="kValue">
                <span class="kBullet" style="color: ${getPrimaryColor()}">&bull;</span>
                ${this._translate.instant('app.entryWebcast.vodViews')}:&nbsp;${value1}
              </div>
              <div class="kValue">
                <span class="kBullet" style="color: ${getPrimaryColor('viewers')}">&bull;</span>
                ${this._translate.instant('app.entryWebcast.engagement.live')}:&nbsp;${value2}
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
            width: 3
          }
        },
        {
          data: yData2,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          yAxisIndex: 1,
          type: 'line',
          lineStyle: {
            color: '#81cc6f',
            width: 3
          }
        }]
    };
    return graphData;
  }

  protected _loadReport(sections = this._dataConfig): void {

    let recordedEntryAvailable = !!this.entryId;

    if (recordedEntryAvailable) {
      this._filter.entryIdIn = this.entryId;
    }

    if (this.liveEntryId) {
      this._liveFilter.entryIdIn = this.liveEntryId;
      const roundSeconds = (epoc: number) => {
        let date = new Date(epoc * 1000);
        return date.setSeconds(0) / 1000;
      }
      this._liveFilter.fromDate = roundSeconds(this.broadcastStartTime);
      this._liveFilter.toDate = roundSeconds(this.broadcastEndTime);
    }

    this._isBusy = true;
    this._blockerMessage = null;
    sections = { ...sections }; // make local copy

    // create 2 report calls and use forkJoin to get them both
    const reportConfigViewers: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: null };

    // prevent calling the report if no recorded entry is available
    const viewers = recordedEntryAvailable ? this._reportService.getReport(reportConfigViewers, sections, false)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      })) : ObservableOf({ report: null, compare: null });

    const reportConfigEngagement: ReportConfig = { reportType: this._liveReportType, filter: this._liveFilter, pager: this._pager, order: null };
    const engagement = this._reportService.getReport(reportConfigEngagement, sections, false)
      .pipe(switchMap(report => {
        return ObservableOf({ report, compare: null });
      }));

    // once both reports return, we need to merge the results and then generate the table and compare data
    forkJoin(viewers, engagement)
      .subscribe(([viewers, engagement]) => {
          this._chartOptions = {};
          let yAxisData1 = Array.from({ length: 100 }, () => 0); // assume no VOD data (no recorded entry)
          let yAxisData2 = Array.from({ length: 100 }, () => 0); // assume no live data (no live views)
          let pointCount = 100; // default for percentiles

          // check if we have live data first and update yAxisData2 if we have it
          if (engagement.report && engagement.report.table && engagement.report.table.header && engagement.report.table.data) {
            const liveTableData = this._reportService.parseTableData(engagement.report.table, this._dataConfig[ReportDataSection.table]).tableData;
            yAxisData2 = this._getLiveAxisData(liveTableData, liveTableData.length);
            if (liveTableData.length > pointCount) {
              pointCount = liveTableData.length; // update pointCount if value is larger than 100
            }
            if (!this.isLive && !recordedEntryAvailable) {
              this._duration = (parseInt(liveTableData[liveTableData.length - 1].position) - parseInt(liveTableData[0].position)) * 1000;
            }
          }

          // check if we have VOD data from recorded entry and update yAxisData1 if we have it
          if (viewers.report && viewers.report.table && viewers.report.table.header && viewers.report.table.data) {
            const {tableData} = this._reportService.parseTableData(viewers.report.table, this._dataConfig[ReportDataSection.table]);
            yAxisData1 = this._getViewersAxisData(tableData, pointCount);
          } else if (pointCount !== 100) {
            yAxisData1 = Array.from({ length: pointCount }, () => 0);
          }

          // set chart data with both live and vod data series
          this._chartOptions = this._getGraphData(yAxisData1, yAxisData2, pointCount );

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

  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._compareFilter = null;
  }

  public _onChartClick(event): void {
    const percent = event.offsetX / event.currentTarget.clientWidth;
    this._seekTo(percent, true);
  }

  private _getViewersAxisData(tableData: TableRow[], pointsCount: number): number[] {
    let result = tableData
      .sort((a, b) => Number(a['percentile']) - Number(b['percentile']))
      .map(item => Number(item['count_viewers'] || 0));

    result[0] = result[1];
    if (pointsCount > 101) {
      let updatedData = [];
      for (let i = 0; i < pointsCount; i++) {
        const indexMap = Math.round(i * 101 / pointsCount);
        updatedData.push(result[indexMap]);
      }
      updatedData[pointsCount -1 ] = updatedData[pointsCount - 2];
      result = updatedData;
    }
    return result;
  }

  private _getLiveAxisData(tableData: TableRow[], pointsCount: number): number[] {
    let result = tableData
      .sort((a, b) => Number(a['position']) - Number(b['position']))
      .map(item => Number(item['live_engaged_users_ratio'] || 0));

    if (pointsCount < 101) {
      let updatedData = [];
      for (let i = 0; i < 101; i++) {
        const indexMap = Math.round(i * pointsCount / 101);
        updatedData.push(result[indexMap]);
      }
      result = updatedData;
    }
    return result;
  }

  /* ------------------------ start of player logic --------------------------*/

  private _initPlayer(): void {
    if (!this._playerInitialized) {
      this._playerInitialized = true;
      this._playerConfig = {
        uiconfid: analyticsConfig.kalturaServer.previewUIConf,  // serverConfig.kalturaServer.previewUIConf,
        pid: this._authService.pid,
        entryid: this.entryId,
        flashvars: {
          'ks': this._authService.ks,
          "EmbedPlayer.LiveCuepoints": true,
          // "IframeCustomPluginCss1" : environment.production ? "assets/player.css" : "../assets/player.css",
          "controlBarContainer": {
            "plugin": true,
            "hover": false
          },
          "durationLabel": {
            "plugin": false
          },
          "currentTimeLabel": {
            "plugin": false
          },
          "fullScreenBtn": {
            "plugin": false
          },
          "theme": {
            "applyToLargePlayButton": true,
            "buttonsSize": 12,
            "buttonsColor": "rgb(51, 51, 51)",
            "buttonsIconColor": "rgb(204, 204, 204)",
            "sliderColor": "rgb(91, 91, 91)",
            "scrubberColor": "rgb(1, 172, 205)",
            "controlsBkgColor": "rgb(51, 51, 51)",
            "watchedSliderColor": "rgb(1, 172, 205)",
            "bufferedSliderColor": "#AFAFAF",
            "timeLabelColor": "rgb(204, 204, 204)",
            "buttonsIconColorDropShadow": true,
            "plugin": true
          },
          "scrubber": {
            "plugin": true,
            'insertMode': 'lastChild',
            'sliderPreview': false
          },
          "dualScreen": {
            "plugin": true,
            "defaultDualScreenViewId": "pip-parent-in-small",
            "showFirstSlideOnLoad": true
          },
          "chapters": {
            "plugin": true
          },
          "sideBarContainer": {
            "plugin": true
          },
          "quiz": {
            "plugin": true
          },
          "liveAnalytics": {
            "plugin": false
          },
          "kAnalony": {
            "plugin": false
          }
        }
      };
      setTimeout(() => {
        this.player.Embed();
      }, 0);
    }
  }

  private _seekTo(percent: number, forcePlay = false): void {
    if (this._playerInstance) {
      this._playerInstance.sendNotification("doSeek", this._duration / 1000 * percent);
      if (forcePlay) {
        this._playerInstance.sendNotification("doPlay");
      }
    }
  }

  public _onPlayerReady(player): void {
    this._playerInstance = player;
    setTimeout(() => {
      this._duration = parseFloat(this._playerInstance.evaluate('{duration}')) * 1000;
    }, 0);

    // register to playhead update event to update our scrubber
    this._playerInstance.kBind('playerUpdatePlayhead', (event) => {
      this.zone.run(() => {
        this._playProgress =  parseFloat((event / this._playerInstance.evaluate('{duration}')).toFixed(10)) * 100;
        this._currentTime = parseFloat(event) * 1000;
      });
    });
    this._playerInstance.kBind('playerPlayEnd', (event) => {
      this.zone.run(() => {
        this._playProgress = 100;
      });
    });
    this._playerInstance.kBind('firstPlay', (event) => {
      this.zone.run(() => {
        this._playerPlayed = true;
      });
    });
    this._playerInstance.kBind('seeked', (event) => {
      this.zone.run(() => {
        this._playProgress =  parseFloat((event / this._playerInstance.evaluate('{duration}')).toFixed(10)) * 100;
        this._currentTime = parseFloat(event) * 1000;
      });
    });

    // inject CSS instead of using IframeCustomPluginCss1 to solve IE11 broken relative path issue
    try {
      let head = player.getElementsByTagName('iframe')[0].contentWindow.document.getElementsByTagName("head")[0];
      if (head) {
        let css = document.createElement('style');
        css['type'] = 'text/css';

        let styles = `
        .scrubber .playHead {
          border-bottom-left-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
          border-top-left-radius: 5px !important;
          border-top-right-radius: 5px !important;
          width: 10px !important;
          height: 14px !important;
        }
        .scrubber .handle-wrapper{
          bottom: 3px !important;
          margin: 0px !important;
        }
        .controlsContainer{
          border-top: none !important;
        }`;

        if (css['styleSheet']) {
          css['styleSheet'].cssText = styles;
        } else {
          css.appendChild(document.createTextNode(styles));
        }
        head.appendChild(css);
      }
    } catch (e) {
      console.log("Failed to inject custom CSS to player");
    }

  }

  /* -------------------------- end of player logic --------------------------*/


}


