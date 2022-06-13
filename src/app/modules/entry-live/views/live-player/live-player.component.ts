import {Component, EventEmitter, Input, NgZone, Output} from '@angular/core';
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
  @Input() thumbnailUrl = '';
  @Output() liveStatusChange = new EventEmitter<boolean>();

  public serverUri = getKalturaServerUri();
  public partnerID = this._authService.pid;
  public UIConfID = analyticsConfig.kalturaServer.previewUIConfV7;
  public ks = this._authService.ks || '';
  public _loadThumbnailWithKs = false;

  constructor(private _authService: AuthService,
              private zone: NgZone,
              private _permissionsService: AnalyticsPermissionsService) {
    this._loadThumbnailWithKs = this._permissionsService.hasPermission(AnalyticsPermissions.FEATURE_LOAD_THUMBNAIL_WITH_KS);
  }

}
