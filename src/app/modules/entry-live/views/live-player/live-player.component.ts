import { Component, Input, AfterViewInit } from '@angular/core';
import { analyticsConfig, getKalturaServerUri } from "configuration/analytics-config";

@Component({
  selector: 'app-live-player',
  templateUrl: './live-player.component.html',
  styleUrls: ['./live-player.component.scss']
})
export class LivePlayerComponent implements AfterViewInit {
  @Input() entryId = '';

  public _frameSrc = '';

  ngAfterViewInit(): void {
    setTimeout(() => {
      this._frameSrc = `${getKalturaServerUri()}/p/${analyticsConfig.pid}/embedPlaykitJs/partner_id/${analyticsConfig.pid}/uiconf_id/${analyticsConfig.live.previewLiveUIConf}?iframeembed=true&entry_id=${this.entryId}`;
    }, 0);

  }


}
