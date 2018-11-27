import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaEntryType } from 'kaltura-ngx-client';

@Pipe({ name: 'appEntryType' })
export class EntryTypePipe implements PipeTransform {
  constructor(private _translate: TranslateService) {
  
  }
  
  transform(type: KalturaEntryType): string {
    switch (type) {
      case KalturaEntryType.mediaClip:
        return this._translate.instant('app.entryType.video');
      case KalturaEntryType.playlist:
        return this._translate.instant('app.entryType.playlist');
      case KalturaEntryType.liveStream:
        return this._translate.instant('app.entryType.live');
      case KalturaEntryType.document:
        return this._translate.instant('app.entryType.document');
      default:
        return this._translate.instant('app.entryType.other');
    }
  }
}
