import { Component, Input, NgZone, OnInit, ViewChild } from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import {
  KalturaFilterPager,
  KalturaObjectBaseFactory,
  KalturaReportInputFilter,
  KalturaReportInterval
} from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {AuthService, ErrorsManagerService, ReportService} from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { EntryPreviewConfig } from './entry-preview.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { KalturaPlayerComponent } from 'shared/player';
import { EntryBase } from '../entry-base/entry-base';

@Component({
  selector: 'app-entry-preview',
  templateUrl: './entry-preview.component.html',
  styleUrls: ['./entry-preview.component.scss'],
  providers: [EntryPreviewConfig, ReportService]
})
export class EntryPreviewComponent extends EntryBase implements OnInit {
  @Input() entryId = '';

  private _dataConfig: ReportDataConfig;

  protected _dateFilter: DateChangeEvent;
  protected _componentId = 'preview';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tabsData: Tab[] = [];
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaReportInputFilter = null;
  public _pager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  public _filter = new KalturaReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  private playerInstance: any = null;
  private playerInitialized = false;

  public _playerConfig: any = {};
  public serverUri = getKalturaServerUri();
  public _playerPlayed = false;
  public _playProgress = 0;
  public _duration = 0;
  public _currentTime = 0;

  public _chartOptions = {};
  public _showHeatmap = false;

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

    this._chartOptions = {
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
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      tooltip : {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        padding: 8,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#333333',
          fontWeight: 'bold'
        }
      },
      yAxis: {
        zlevel: 1,
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
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        symbol: 'circle',
        symbolSize: 8,
        type: 'line',
        color: '#487adf',
        lineStyle: {
          color: '#487adf',
          width: 2
        }
      }]
    };
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    console.log("Load report...");
  }
  
  protected _updateRefineFilter(): void {
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

  public toggleHeatmap(): void {
    this._showHeatmap = !this._showHeatmap;
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
          "IframeCustomPluginCss1" : "../assets/player.css",
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

  }

  /* -------------------------- end of player logic --------------------------*/


}


