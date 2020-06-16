import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaLiveStreamBroadcastStatus } from "kaltura-ngx-client";

@Pipe({
  name: 'broadcastStatus'
})
export class BroadcastStatusPipe implements PipeTransform {
  constructor(private _appLocalization: TranslateService) {
  }

  transform(status: KalturaLiveStreamBroadcastStatus): string {
    let result = '';
    switch (status) {
      case KalturaLiveStreamBroadcastStatus.live:
        result = this._appLocalization.instant('app.entriesLive.broadcastStatus.live');
        break;
      case KalturaLiveStreamBroadcastStatus.offline:
        result = this._appLocalization.instant('app.entriesLive.broadcastStatus.offline');
        break;
      case KalturaLiveStreamBroadcastStatus.preview:
        result = this._appLocalization.instant('app.entriesLive.broadcastStatus.preview');
        break;
      default:
        break;
    }

    return result;
  }

}
