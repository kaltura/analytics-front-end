import { Component, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { analyticsConfig, getKalturaServerUri } from "configuration/analytics-config";
import { AuthService } from "shared/services";
import { AnalyticsPermissions } from "shared/analytics-permissions/analytics-permissions";
import { AnalyticsPermissionsService } from "shared/analytics-permissions/analytics-permissions.service";

@Component({
  selector: 'app-live-player',
  templateUrl: './live-player.component.html',
  styleUrls: ['./live-player.component.scss']
})
export class LivePlayerComponent {
  @Input() entryId = '';
  @Output() liveStatusChange = new EventEmitter<boolean>();

  public serverUri = getKalturaServerUri();
  public partnerID = parseInt(this._authService.pid);
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
  public _loadThumbnailWithKs = false;

  constructor(private _authService: AuthService,
              private zone: NgZone,
              private _permissionsService: AnalyticsPermissionsService) {
    this._loadThumbnailWithKs = this._permissionsService.hasPermission(AnalyticsPermissions.FEATURE_LOAD_THUMBNAIL_WITH_KS);
  }

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
