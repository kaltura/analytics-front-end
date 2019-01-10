import {Component, Input, NgZone, OnInit, ViewChild} from '@angular/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { KalturaReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTotal, KalturaReportType } from 'kaltura-ngx-client';
import {AreaBlockerMessage, AreaBlockerMessageButton, KalturaPlayerComponent} from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorDetails, ErrorsManagerService, Report, ReportConfig, ReportService } from 'shared/services';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { EntryPreviewConfig } from './entry-preview.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import {analyticsConfig, getKalturaServerUri} from 'configuration/analytics-config';
import {DateChangeEvent} from "shared/components/date-filter/date-filter.service";
import {ISubscription} from "rxjs-compat/Subscription";

@Component({
  selector: 'app-entry-preview',
  templateUrl: './entry-preview.component.html',
  styleUrls: ['./entry-preview.component.scss'],
  providers: [EntryPreviewConfig, ReportService]
})
export class EntryPreviewComponent implements OnInit {

  private _dataConfig: ReportDataConfig;
  private _dateFilter: DateChangeEvent;
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      this._dateFilter = value;
      this._updateFilter();
      this._loadReport();
    }
  }
  @Input() entryId = '';


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
  private playing = false;
  private playerInitialized = false;

  public _playerConfig: any = {};
  public serverUri = getKalturaServerUri();
  public _playerPlayed = false;
  public _playProgress = 0;

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
    
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit() {
    this.initPlayer();

    this._chartOptions = {
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
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
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
          show: false
        },
        axisLabel: {
          inside: true,
          margin: 4,
          verticalAlign: 'bottom',
          color: '#ffffff'
        }
      },
      series: [{
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
        areaStyle: {}
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
      this._compareFilter = new KalturaReportInputFilter({
        searchInTags: true,
        searchInAdminTags: false,
        timeZoneOffset: this._dateFilter.timeZoneOffset,
        interval: this._dateFilter.timeUnits,
        fromDay: compare.startDay,
        toDay: compare.endDay,
      });
    } else {
      this._compareFilter = null;
    }
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
          'controlBarContainer': {'plugin': false},
          'largePlayBtn': {'plugin': false},
          'ks': analyticsConfig.ks
        }
      };
      setTimeout(() => {
        this.player.Embed();
      }, 0);
    }
  }

  public onPlayerReady(player): void {
    this.playerInstance = player;
    const entryDuration = this.playerInstance.evaluate('{duration}');
    // register to playhead update event to update our scrubber
    this.playerInstance.kBind('playerUpdatePlayhead', (event) => {
      this.zone.run(() => {
        this._playProgress =  parseFloat((event / this.playerInstance.evaluate('{duration}')).toFixed(2)) * 100;
      });
    });
    this.playerInstance.kBind('playerPlayEnd', (event) => {
      this.zone.run(() => {
        this._playProgress = 100;
      });
    });

    // we need to disable the player receiving clicks that toggle playback
    setTimeout(() => {
      const playerIframe = document.getElementById('kaltura_player_analytics_ifp');
      const doc = playerIframe['contentDocument'] || playerIframe['contentWindow'].document;
      if (doc) {
        doc.getElementsByClassName('mwEmbedPlayer')[0].style.pointerEvents = 'none';
      }
    }, 250); // use a timeout as player ready event still issues some async initialization calls
  }

  public _togglePlayback(): void {
    this.playing = !this.playing;
    this._playerPlayed = true;
    const command = this.playing ? 'doPlay' : 'doPause';
    this.playerInstance.sendNotification(command);
  }

  /* -------------------------- end of player logic --------------------------*/


}


