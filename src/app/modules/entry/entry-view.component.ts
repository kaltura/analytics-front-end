import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { KalturaPlayerComponent } from '@kaltura-ng/kaltura-ui';
import { ISubscription } from 'rxjs/Subscription';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';

@Component({
  selector: 'app-entry',
  templateUrl: './entry-view.component.html',
  styleUrls: ['./entry-view.component.scss']
})
export class EntryViewComponent implements OnInit, OnDestroy {

  private subscription: ISubscription;
  private playerInstance: any = null;
  private playing = false;

  public _playerConfig: any = {};
  public serverUri = getKalturaServerUri();
  public _entryId = '';
  public _entryName = '';

  @ViewChild('player') player: KalturaPlayerComponent;

  constructor(private location: Location, private route: ActivatedRoute) { }

  ngOnInit() {
    this.subscription = this.route.params.subscribe(params => {
      this._entryId = params['id'];
      this._playerConfig = {
        uiconfid:  analyticsConfig.kalturaServer.previewUIConf,  // serverConfig.kalturaServer.previewUIConf,
        pid: analyticsConfig.pid,
        entryid: this._entryId,
        flashvars: {'controlBarContainer': { 'plugin': false }, 'largePlayBtn': { 'plugin': false }, 'ks': analyticsConfig.ks}
      };
      setTimeout(() => {
        this.player.Embed();
      }, 0);

      this.loadReport();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private loadReport() {

  }
  public onPlayerReady(player): void {
    this.playerInstance = player;
    // we need to disable the player receiving clicks that toggle playback
    setTimeout(() => {
      const playerIframe = document.getElementById('kaltura_player_analytics_ifp');
      const doc = playerIframe['contentDocument'] || playerIframe['contentWindow'].document;
      if (doc) {
        doc.getElementsByClassName('mwEmbedPlayer')[0].style.pointerEvents = 'none';
      }
    }, 200);
  }

  public _togglePlayback(): void {
    this.playing = !this.playing;
    const command = this.playing ? 'doPlay' : 'doPause';
    this.playerInstance.sendNotification(command);
  }

  public _back(): void {
    this.location.back();
  }
}
