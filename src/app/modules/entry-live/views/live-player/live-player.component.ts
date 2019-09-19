import { Component, Input, AfterViewInit } from '@angular/core';
import { analyticsConfig, getKalturaServerUri } from "configuration/analytics-config";
import { AuthService } from "shared/services";

@Component({
  selector: 'app-live-player',
  templateUrl: './live-player.component.html',
  styleUrls: ['./live-player.component.scss']
})
export class LivePlayerComponent implements AfterViewInit {
  @Input() entryId = '';
  public _frameSrc = '';

  constructor(private _authService: AuthService) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this._frameSrc = this._createUrl();
    }, 200); // safari needs it

  }

  private _createUrl(): string {

    let result = "";

    // create preview embed code

    const entryId = this.entryId;
    const UIConfID = analyticsConfig.kalturaServer.previewUIConf;
    const partnerID = this._authService.pid;
    const ks = this._authService.ks || '';
    const serverUri = getKalturaServerUri();

    let flashVars = `flashvars[autoPlay]=true&flashvars[autoMute]=true&flashvars[kAnalony.plugin]=false&flashvars[ks]=${ks}&flashvars[disableEntryRedirect]=true&flashvars[SkipKSOnIsLiveRequest]=false`;
    result = `${serverUri}/p/${partnerID}/sp/${partnerID}00/embedIframeJs/uiconf_id/${UIConfID}/partner_id/${partnerID}?iframeembed=true&${flashVars}&entry_id=${entryId}`;

    return result;
  }


}
