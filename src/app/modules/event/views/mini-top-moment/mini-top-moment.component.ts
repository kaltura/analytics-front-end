import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import {analyticsConfig, getKalturaServerUri} from "configuration/analytics-config";
import {AuthService} from "shared/services";

@Component({
  selector: 'app-event-mini-top-moment',
  templateUrl: './mini-top-moment.component.html',
  styleUrls: ['./mini-top-moment.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopMomentComponent')
  ]
})

export class MiniTopMomentComponent implements OnInit, OnDestroy {

  protected _componentId = 'event-mini-top-moment';

  public _isBusy = false;
  public serverUri = getKalturaServerUri();
  public _playerConfig: any = {};

  public _noData = false;
  public _entryId = '';
  public _entryName = '';
  public _seekFrom = 0;
  public _clipTo = 0;
  public _peakViewers = '';

  public _playerInstance: any = {};
  public _playing = false;

  constructor(private _authService: AuthService) {
  }

  ngOnInit(): void {
    this._isBusy = true;
    this._playerConfig = {
      uiconfid: analyticsConfig.kalturaServer.previewUIConfV7,
      pid: this._authService.pid,
      ks: this._authService.ks,
      plugins: {
        "share": {
          "shareUrl": "",
          "embedUrl": "{embedBaseUrl}/p/{partnerId}/embedPlaykitJs/uiconf_id/{uiConfId}?iframeembed=true&entry_id={entryId}",
          "enableClipping": true,
          "enableTimeOffset": true,
          "useNative": false,
          "shareOptions": {
            "email": {
              "display": true,
              "templateUrl": "mailto:?subject=Check out {description}&body=Check out {description} - {shareUrl}",
              "title": "share.email",
              "icon": {
                "fill-rule": "evenodd",
                "clip-rule": "evenodd",
                "d": "M21 6.75C21 5.7835 20.1941 5 19.2 5H4.8C3.80589 5 3 5.7835 3 6.75V17.25C3 18.2165 3.80589 19 4.8 19H19.2C20.1941 19 21 18.2165 21 17.25V6.75ZM18.8944 8.55276C18.6474 8.05878 18.0467 7.85856 17.5528 8.10555L12 10.881L6.44719 8.10555L6.33987 8.05941C5.8692 7.88866 5.33489 8.09407 5.10555 8.55276C4.85856 9.04674 5.05878 9.64741 5.55276 9.8944L11.5528 12.8944L11.6762 12.9461C11.9279 13.0323 12.2059 13.0151 12.4472 12.8944L18.4472 9.8944L18.5485 9.83623C18.9675 9.56215 19.1237 9.01146 18.8944 8.55276Z"
              }
            },
            "embed": {
              "display": true,
              "templateUrl": "%3Ciframe%20src%3D%22%7BembedUrl%7D%22%20style%3D%22width%3A%20%7Bwidth%7Dpx%3Bheight%3A%20%7Bheight%7Dpx%22%20allowfullscreen%20webkitallowfullscreen%20mozAllowFullScreen%20frameborder%3D%220%22%20allow%3D%22accelerometer%20*%3B%20autoplay%20*%3B%20encrypted-media%20*%3B%20gyroscope%20*%3B%20picture-in-picture%20*%22%2F%3E",
              "title": "share.embed",
              "icon": "M13.9864 6.16443C14.0772 5.61966 13.7092 5.10444 13.1644 5.01364C12.6197 4.92285 12.1044 5.29086 12.0136 5.83564L10.0136 17.8356C9.92284 18.3804 10.2909 18.8956 10.8356 18.9864C11.3804 19.0772 11.8956 18.7092 11.9864 18.1644L13.9864 6.16443Z M15.2929 15.7071C14.9024 15.3166 14.9024 14.6834 15.2929 14.2929L17.5858 12L15.2929 9.70711C14.9024 9.31658 14.9024 8.68342 15.2929 8.29289C15.6834 7.90237 16.3166 7.90237 16.7071 8.29289L19.7071 11.2929C20.0976 11.6834 20.0976 12.3166 19.7071 12.7071L16.7071 15.7071C16.3166 16.0976 15.6834 16.0976 15.2929 15.7071Z M8.70711 8.29289C9.09763 8.68342 9.09763 9.31658 8.70711 9.70711L6.41421 12L8.70711 14.2929C9.09763 14.6834 9.09763 15.3166 8.70711 15.7071C8.31658 16.0976 7.68342 16.0976 7.29289 15.7071L4.29289 12.7071C3.90237 12.3166 3.90237 11.6834 4.29289 11.2929L7.29289 8.29289C7.68342 7.90237 8.31658 7.90237 8.70711 8.29289Z"
            },
            "facebook": {
              "display": true,
              "templateUrl": "https://www.facebook.com/sharer/sharer.php?u={shareUrl}",
              "title": "share.share-on-facebook",
              "icon": "M8 9.63017H9.5003V8.22342C9.5003 7.60278 9.51651 6.64628 9.98306 6.05362C10.4752 5.42639 11.1499 5 12.3116 5C14.2034 5 15 5.26011 15 5.26011L14.6256 7.4044C14.6256 7.4044 14.0004 7.23072 13.417 7.23072C12.8336 7.23072 12.3116 7.43238 12.3116 7.99459V9.63017H14.7032L14.536 11.7242H12.3116V19H9.5003V11.7242H8V9.63017Z"
            },
            "linkedin": {
              "display": true,
              "templateUrl": "https://www.linkedin.com/shareArticle?mini=true&url={shareUrl}",
              "title": "share.share-on-linkedin",
              "icon": "M18 19H15.1268V14.43C15.1268 13.2338 14.6774 12.4172 13.6891 12.4172C12.9331 12.4172 12.5128 12.9682 12.3171 13.4993C12.2437 13.69 12.2552 13.9555 12.2552 14.221V19H9.40875C9.40875 19 9.44544 10.9047 9.40875 10.1688H12.2552V11.5548C12.4233 10.9488 13.3329 10.0839 14.7844 10.0839C16.5852 10.0839 18 11.3542 18 14.0895V19ZM6.53022 9.06416H6.51188C5.59466 9.06416 5 8.38906 5 7.53333C5 6.66095 5.61224 6 6.5478 6C7.4826 6 8.05738 6.65928 8.07573 7.53083C8.07573 8.38657 7.4826 9.06416 6.53022 9.06416ZM5.3279 19H7.86171V10.1688H5.3279V19Z"
            },
            "twitter": {
              "display": true,
              "templateUrl": "https://twitter.com/intent/tweet?url={shareUrl}",
              "title": "share.share-on-twitter",
              "icon": "M16.4284 5H18.7899L13.6308 10.9303L19.7001 19H14.9479L11.2258 14.1057L6.96694 19H4.60406L10.1222 12.6569L4.29996 5H9.17277L12.5372 9.47354L16.4284 5ZM15.5997 17.5785H16.9082L8.46176 6.34687H7.0576L15.5997 17.5785Z"
            }
          }
        },
        "download": {
          "displaySources": true,
          "displayFlavors": true,
          "displayCaptions": true,
          "displayAttachments": true
        }
      }
    };
    setTimeout(() => {
      this._isBusy = false;
      this._entryId = '1_e0k67kye';
      this._entryName = 'Event platform registration';
      this._seekFrom = 60;
      this._clipTo = 120;
      this._peakViewers = '4,032';
    }, 1000);
  }

  public _onPlayerReady(player): void {
    this._playerInstance = player;
    this._playerInstance.addEventListener(this._playerInstance.Event.PLAY, event => {
      this._playing = true;
    });
  }

  ngOnDestroy(): void {
  }

}
