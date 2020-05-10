import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaRecordingStatus } from "kaltura-ngx-client";

@Pipe({
  name: 'liveRecordingStatus'
})
export class RecordingStatusPipe implements PipeTransform {
  constructor(private _appLocalization: TranslateService) {
  }

  transform(status: KalturaRecordingStatus): string {
    let result = '';
    switch (status) {
      case KalturaRecordingStatus.active:
        result = this._appLocalization.instant('app.entriesLive.recordingStatus.active');
        break;
      case KalturaRecordingStatus.paused:
        result = this._appLocalization.instant('app.entriesLive.recordingStatus.paused');
        break;
      case KalturaRecordingStatus.disabled:
        result = this._appLocalization.instant('app.entriesLive.recordingStatus.disabled');
        break;
      case KalturaRecordingStatus.stopped:
        result = this._appLocalization.instant('app.entriesLive.recordingStatus.stopped');
        break;
      default:
        break;
    }

    return result;
  }

}
