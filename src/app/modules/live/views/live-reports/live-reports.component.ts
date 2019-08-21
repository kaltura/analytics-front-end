import { Component, OnInit, OnDestroy } from '@angular/core';
import { analyticsConfig, getKalturaServerUri, buildCDNUrl } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { AuthService } from "shared/services";

@Component({
  selector: 'app-live-reports',
  templateUrl: './live-reports.component.html',
  styleUrls: ['./live-reports.component.scss']
})
export class LiveReportsComponent implements OnInit, OnDestroy {

  public _url = null;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _authService: AuthService) { }

  ngOnInit() {
    let cdn_host = buildCDNUrl('');
    cdn_host = cdn_host.substr(cdn_host.indexOf('://') + 3); // remove protocol as Live Analytics app adds it itself
    window['kmc'] = {
      'vars': {
        'ks': this._authService.ks,
        'partner_id': this._authService.pid,
        'cdn_host': cdn_host,
        'service_url': getKalturaServerUri(),
        'liveanalytics': {
          'player_id': analyticsConfig.liveAnalytics.uiConfId || '',
          'map_urls': analyticsConfig.liveAnalytics.mapUrls || [],
          'map_zoom_levels': analyticsConfig.liveAnalytics.mapZoomLevels || ''
        }
      },
      'functions': {
        expired: () => {
          this._frameEventManager.publish(FrameEvents.Logout);
        }
      }
    };

    this._url = analyticsConfig.liveAnalytics.uri + '#/dashboard/nonav';
  }

  ngOnDestroy() {
    this._url = null;
    window['kmc'] = null;
  }

}
