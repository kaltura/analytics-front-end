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
import { EntryBase } from '../entry-base/entry-base';
import {getPrimaryColor, getSecondaryColor} from 'shared/utils/colors';
import {map, switchMap} from "rxjs/operators";
import {of as ObservableOf} from "rxjs";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {environment} from "../../../../../environments/environment";

@Component({
  selector: 'app-entry-preview',
  templateUrl: './entry-preview.component.html',
  styleUrls: ['./entry-preview.component.scss'],
  providers: [EntryPreviewConfig, ReportService]
})
export class EntryPreviewComponent extends EntryBase implements OnInit {
  @Input() entryId = '';

  private _dataConfig: ReportDataConfig;
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private playerInstance: any = null;
  private playerInitialized = false;
  private _reportType = KalturaReportType.percentiles;

  public _dateFilter: DateChangeEvent;
  protected _componentId = 'preview';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _filter = new KalturaEndUserReportInputFilter({
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
    this.initPlayer();
  }
  
  private _getGraphData(yData: number[], compareYData: number[] = null) {
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
        boundaryGap : false,
        type: 'category',
        data: Array.from({ length: 100 }, (_, i) => i + 1),
      },
      tooltip : {
        formatter: params => {
          const { value, dataIndex } = Array.isArray(params) ? params[0] : params;
          const progressValue = ReportHelper.time(String(dataIndex / 99 * this._duration)); // empirically found formula, closest result to expected so far
          let tooltip =  `
            <div class="kEntryGraphTooltip">
              <div class="kCurrentTime">${progressValue}</div>
              <div class="kValue">
                <span class="kBullet" style="color: ${getPrimaryColor()}">&bull;</span>
                ${this._translate.instant('app.entry.views')}:&nbsp;${value}
              </div>
            </div>
          `;
          if (this._isCompareMode && Array.isArray(params) && params.length > 1) {
            const compareValue = params[1].value;
            const dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'MM/DD/YYY' : 'DD/MM/YYYY';
            const currentDatePeriod = DateFilterUtils.getMomentDate(this._filter.fromDate).format(dateFormat) + ' - ' + DateFilterUtils.getMomentDate(this._filter.toDate).format(dateFormat);
            const compareDatePeriod = DateFilterUtils.getMomentDate(this._compareFilter.fromDate).format(dateFormat) + ' - ' + DateFilterUtils.getMomentDate(this._compareFilter.toDate).format(dateFormat);

            tooltip = `
              <div style="font-weight: normal; color: #999999">${progressValue}</div>
              <div class="kEntryCompareGraphTooltip" style="padding-bottom: 0px">
                <span class="kBullet" style="color: ${getPrimaryColor()}">&bull;</span>
                <span>${currentDatePeriod}</span>
                <span style="margin-left: 24px">${this._translate.instant('app.entry.views')}:&nbsp;${value}</span>
              </div>
              <div class="kEntryCompareGraphTooltip" style="padding-top: 0px">
                <span class="kBullet" style="color: ${getSecondaryColor()}">&bull;</span>
                <span>${compareDatePeriod}</span>
                <span style="margin-left: 24px">${this._translate.instant('app.entry.views')}:&nbsp;${compareValue}</span>
              </div>
           `;
          }
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
      yAxis: {
        zlevel: 0,
        type: 'value',
        position: 'right',
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
          inside: true,
          margin: 4,
          verticalAlign: 'top',
          padding: [8, 0, 0, 0],
          color: '#FFFFFF'
        }
      },
      series: [{
        data: yData,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        type: 'line',
        lineStyle: {
          color: '#487adf',
          width: 2
        }
      }]
    };
    if (compareYData !== null) {
      graphData.series.push({
        data: compareYData,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        type: 'line',
        lineStyle: {
          color: '#88acf6',
          width: 2
        }
      });
    }
    return graphData;
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
  
    if (this.entryId) {
      this._filter.entryIdIn = this.entryId;
    }
  
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: null };
    if (reportConfig['objectIds__null']) {
      delete reportConfig['objectIds__null'];
    }
    reportConfig.objectIds = this.entryId;
    sections = { ...sections }; // make local copy

    this._reportService.getReport(reportConfig, sections)
      .pipe(switchMap(report => {
        if (!this._isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig: ReportConfig = { reportType: this._reportType, filter: this._compareFilter, pager: this._pager, order: null };
        if (compareReportConfig['objectIds__null']) {
          delete compareReportConfig['objectIds__null'];
        }
        compareReportConfig.objectIds = this.entryId;
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          this._isBusy = false;
          this._chartOptions = {};

          if (report.table && report.table.header && report.table.data) {
            const {tableData} = this._reportService.parseTableData(report.table, this._dataConfig[ReportDataSection.table]);
            const yAxisData = tableData
              .sort((a, b) => Number(a['percentile']) - Number(b['percentile']))
              .map(item => Number(item['count_viewers']));
  
            yAxisData[0] = yAxisData[1]; // fake first item because of limitation when first item always is 0

            if (compare && compare.table) {
              let compareYAxisData = [];
              if (compare.table.header && compare.table.data) {
                const compareTableData = this._reportService.parseTableData(compare.table, this._dataConfig[ReportDataSection.table]).tableData;
                compareYAxisData = compareTableData
                  .sort((a, b) => Number(a['percentile']) - Number(b['percentile']))
                  .map(item => Number(item['count_viewers']));
              } else {
                compareYAxisData = Array.from({ length: 100 }, () => 0);
              }
  
              compareYAxisData[0] = compareYAxisData[1]; // fake first item because of limitation when first item always is 0

              this._chartOptions = this._getGraphData(yAxisData, compareYAxisData);
            } else {
              this._chartOptions = this._getGraphData(yAxisData);
            }
          } else {
            this._chartOptions = this._getGraphData(Array.from({ length: 100 }, () => 0));
          }

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
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }

  public onChartClick(event): void {
    const percent = event.offsetX / event.currentTarget.clientWidth;
    this.seekTo(percent, true);
  }

  /* ------------------------ start of player logic --------------------------*/

  private initPlayer(): void {
    if (!this.playerInitialized) {
      this.playerInitialized = true;
      this._playerConfig = {
        uiconfid: analyticsConfig.kalturaServer.previewUIConf,  // serverConfig.kalturaServer.previewUIConf,
        pid: analyticsConfig.pid,
        entryid: this.entryId,
        flashvars: {
          'ks': analyticsConfig.ks,
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
          }
        }
      };
      setTimeout(() => {
        this.player.Embed();
      }, 0);
    }
  }

  public onPlayerReady(player): void {
    this.playerInstance = player;
    setTimeout(() => {
      this._duration = parseFloat(this.playerInstance.evaluate('{duration}')) * 1000;
    }, 0);

    // register to playhead update event to update our scrubber
    this.playerInstance.kBind('playerUpdatePlayhead', (event) => {
      this.zone.run(() => {
        this._playProgress =  parseFloat((event / this.playerInstance.evaluate('{duration}')).toFixed(10)) * 100;
        this._currentTime = parseFloat(event) * 1000;
      });
    });
    this.playerInstance.kBind('playerPlayEnd', (event) => {
      this.zone.run(() => {
        this._playProgress = 100;
      });
    });
    this.playerInstance.kBind('firstPlay', (event) => {
      this.zone.run(() => {
        this._playerPlayed = true;
      });
    });
    this.playerInstance.kBind('seeked', (event) => {
      this.zone.run(() => {
        this._playProgress =  parseFloat((event / this.playerInstance.evaluate('{duration}')).toFixed(10)) * 100;
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

  private seekTo(percent: number, forcePlay = false): void {
    this.playerInstance.sendNotification("doSeek", this._duration / 1000 * percent);
    if (forcePlay) {
      this.playerInstance.sendNotification("doPlay");
    }
  }

  /* -------------------------- end of player logic --------------------------*/


}


