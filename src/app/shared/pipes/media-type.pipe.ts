import { Pipe, PipeTransform } from '@angular/core';
import { KalturaMediaType, KalturaPlaylistType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';

@Pipe({name: 'mediaType'})
export class MediaTypePipe implements PipeTransform {

    constructor(private translate: TranslateService) {
    }

    transform(value, isTooltip: boolean): string {
        let className = "";
        let tooltip = "";
        if (typeof(value) !== 'undefined' && value !== null) {
            switch (value) {
                case KalturaMediaType.video:
                    className = 'kIconvideo-small';
                    tooltip = this.translate.instant("app.entry.entryType.video");
                    break;
                case KalturaMediaType.image:
                    tooltip = this.translate.instant("app.entry.entryType.image");
                    className = 'kIconimage-small';
                    break;
                case KalturaMediaType.audio:
                    tooltip = this.translate.instant("app.entry.entryType.audio");
                    className = 'kIconsound-small';
                    break;
                case KalturaMediaType.liveStreamFlash:
                case KalturaMediaType.liveStreamQuicktime:
                case KalturaMediaType.liveStreamRealMedia:
                case KalturaMediaType.liveStreamWindowsMedia:
                    tooltip = this.translate.instant("app.entry.entryType.live");
                    className = 'kIconlive_transcoding';
                    break;
                case KalturaPlaylistType.staticList:
                  tooltip = this.translate.instant("app.entryType.interactive");
                  className = 'kIconplaylist_interactive_small';
                  break;
                default:
                    tooltip = this.translate.instant("app.entry.entryType.unknown");
                    className = 'kIconfile-small';
                    break;
            }
        }
        if (isTooltip) {
            return tooltip;
        } else {
            return className;
        }
    }
}
