import { Component, OnInit, OnDestroy } from '@angular/core';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';

@Component({
  selector: 'app-live-reports',
  templateUrl: './live-reports.component.html',
  styleUrls: ['./live-reports.component.scss']
})
export class LiveReportsComponent implements OnInit, OnDestroy {

  public _url = null;

  constructor() { }

  ngOnInit() {
    const cdnUrl = analyticsConfig.cdnServers.serverUri.replace('http://', '').replace('https://', '');
    window['kmc'] = {
      'vars': {
        'ks': analyticsConfig.ks,
        'partner_id': analyticsConfig.pid,
        'cdn_host': cdnUrl,
        'service_url': getKalturaServerUri(),
        'liveanalytics': {
          'player_id': analyticsConfig.liveAnalytics.uiConfId || '',
          'map_urls': analyticsConfig.liveAnalytics.mapUrls || [],
          'map_zoom_levels': analyticsConfig.liveAnalytics.mapZoomLevels || ''
        }
      },
      'functions': {
        expired: () => {
          window.parent.postMessage({
            'messageType': 'logout'
          }, "*");
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
