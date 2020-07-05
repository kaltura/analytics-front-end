import { Component, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { analyticsConfig, getKalturaServerUri } from "configuration/analytics-config";
import { AuthService } from "shared/services";

@Component({
  selector: 'app-live-player',
  templateUrl: './live-player.component.html',
  styleUrls: ['./live-player.component.scss']
})
export class LivePlayerComponent {
  @Input() entryId = '';
  @Output() liveStatusChange = new EventEmitter<boolean>();

  public serverUri = getKalturaServerUri();
  public partnerID = this._authService.pid;
  public UIConfID = analyticsConfig.kalturaServer.previewUIConf;
  public flashvars = {
    "autoPlay": true,
    "autoMute": true,
    "ks": this._authService.ks || '',
    "disableEntryRedirect": true,
    "SkipKSOnIsLiveRequest": false,
    "kAnalony": {
      "plugin": false
    }
  };

  constructor(private _authService: AuthService, private zone: NgZone) {}

  public _onPlayerReady(player): void {
    const playerInstance = player;

    playerInstance.kBind('liveOnline', (event) => {
      this.zone.run(() => {
        this.liveStatusChange.emit(true);
      });
    });
    playerInstance.kBind('firstPlay', (event) => {
      this.zone.run(() => {
        this.liveStatusChange.emit(true);
      });
    });
    playerInstance.kBind('liveOffline', (event) => {
      this.zone.run(() => {
        this.liveStatusChange.emit(false);
      });
    });

  }

}
