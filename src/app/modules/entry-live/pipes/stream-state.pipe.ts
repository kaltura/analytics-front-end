import { Pipe, PipeTransform } from '@angular/core';
import { KalturaStreamStatus } from '../utils/get-stream-status';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'appStreamState'
})
export class StreamStatePipe implements PipeTransform {
  constructor(private _appLocalization: TranslateService) {
  }
  
  transform(status: KalturaStreamStatus): string {
    switch (status) {
      case KalturaStreamStatus.live:
        return this._appLocalization.instant('app.entryLive.streamStatus.live');
      case KalturaStreamStatus.offline:
        return this._appLocalization.instant('app.entryLive.streamStatus.offline');
      case KalturaStreamStatus.initializing:
        return this._appLocalization.instant('app.entryLive.streamStatus.initializing');
      case KalturaStreamStatus.preview:
        return this._appLocalization.instant('app.entryLive.streamStatus.preview');
      default:
        return '';
    }
  }
  
}
