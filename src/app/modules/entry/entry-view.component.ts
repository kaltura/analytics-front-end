import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import {AreaBlockerMessage, KalturaPlayerComponent} from '@kaltura-ng/kaltura-ui';
import { ISubscription } from 'rxjs/Subscription';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import {
  BaseEntryGetAction, KalturaBaseEntry, KalturaClient,
  KalturaDetachedResponseProfile, KalturaReportInputFilter, KalturaMediaEntry,
  KalturaMultiResponse, KalturaReportInterval, KalturaReportType,
  KalturaResponseProfileType, KalturaUser
} from "kaltura-ngx-client";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {map} from "rxjs/operators";
import {EntryDetailsOverlayData} from "../audience/views/engagement/top-videos/entry-details-overlay/entry-details-overlay.component";
import {Unsubscribable} from "rxjs";
import {DateChangeEvent, DateRanges} from "shared/components/date-filter/date-filter.service";
import {RefineFilter} from "shared/components/filter/filter.component";

@Component({
  selector: 'app-entry',
  templateUrl: './entry-view.component.html',
  styleUrls: ['./entry-view.component.scss']
})
export class EntryViewComponent implements OnInit, OnDestroy, AfterViewInit {

  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _csvExportHeaders = '';
  public _totalCount: number;
  public _reportType: KalturaReportType = KalturaReportType.userUsage;
  public _selectedMetrics: string;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private subscription: ISubscription;
  private requestSubscription: ISubscription;
  private playerInstance: any = null;
  private playing = false;
  private playerInitialized = false;

  public _chartOptions = {};
  public _playerConfig: any = {};
  public serverUri = getKalturaServerUri();
  public _entryId = '';
  public _entryName = '';
  public _playerPlayed = false;
  public _playProgress = 0;

  @ViewChild('player') player: KalturaPlayerComponent;

  constructor(private location: Location, private route: ActivatedRoute, private zone: NgZone, private _kalturaClient: KalturaClient) { }

  ngOnInit() {
    this.subscription = this.route.params.subscribe(params => {
      this._entryId = params['id'];
      this.loadEntryDetails();
      this.initPlayer();
      this.loadReport();
    });

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

  ngAfterViewInit() {
    this.initPlayer();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

  private loadEntryDetails(): void {
    const request = new BaseEntryGetAction({ entryId: this._entryId })
      .setRequestOptions({
        responseProfile: new KalturaDetachedResponseProfile({
          type: KalturaResponseProfileType.includeFields,
          fields: 'name'
        })
      });

    this.requestSubscription = this._kalturaClient
      .request(request)
      .pipe(
        cancelOnDestroy(this)
      )
      .subscribe(
        (entry: KalturaBaseEntry) => {
          this._entryName = entry.name;
        },
        error => {
          console.error("Failed to load entry name: " + error.message);
        });
  }

  private loadReport() {

  }

  public _back(): void {
    this.location.back();
  }

  /* ------------------------ start of player logic --------------------------*/

  private initPlayer(): void {
    if (!this.playerInitialized) {
      this.playerInitialized = true;
      this._playerConfig = {
        uiconfid: analyticsConfig.kalturaServer.previewUIConf,  // serverConfig.kalturaServer.previewUIConf,
        pid: analyticsConfig.pid,
        entryid: this._entryId,
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
