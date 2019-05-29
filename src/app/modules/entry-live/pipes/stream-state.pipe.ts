import { Pipe, PipeTransform } from '@angular/core';
import { KalturaStreamStatus } from '../utils/get-stream-status';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'appStreamState'
})
export class StreamStatePipe implements PipeTransform {
  constructor(private _appLocalization: TranslateService) {
  }
  
  transform(status: KalturaStreamStatus, icon = false): string {
    let result = {
      icon: '',
      status: ''
    };
    switch (status) {
      case KalturaStreamStatus.live:
        result = {
          status: this._appLocalization.instant('app.entryLive.streamStatus.live'),
          icon: 'kStatusActive',
        };
        break;
      case KalturaStreamStatus.offline:
        result = {
          status: this._appLocalization.instant('app.entryLive.streamStatus.offline'),
          icon: 'icon-stream_offline',
        };
        break;
      case KalturaStreamStatus.initializing:
        result = {
          status: this._appLocalization.instant('app.entryLive.streamStatus.initializing'),
          icon: 'icon-stream_processing',
        };
        break;
      case KalturaStreamStatus.preview:
        result = {
          status: this._appLocalization.instant('app.entryLive.streamStatus.preview'),
          icon: 'icon-preview',
        };
        break;
      default:
        break;
    }
  
    return icon ? result.icon : result.status;
  }
  
}
