import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaDVRStatus } from "kaltura-ngx-client";

@Pipe({
  name: 'liveDvrStatus'
})
export class DVRStatusPipe implements PipeTransform {
  constructor(private _appLocalization: TranslateService) {
  }

  transform(status: KalturaDVRStatus): string {
    let result = '';
    switch (status) {
      case KalturaDVRStatus.disabled:
        result = this._appLocalization.instant('app.entriesLive.dvrStatus.disabled');
        break;
      case KalturaDVRStatus.enabled:
        result = this._appLocalization.instant('app.entriesLive.dvrStatus.enabled');
        break;
      default:
        break;
    }

    return result;
  }

}
