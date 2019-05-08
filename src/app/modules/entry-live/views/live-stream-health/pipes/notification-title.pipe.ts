import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SeverityToHealthPipe } from './severity-to-health.pipe';
import { StreamHealth } from '../live-stream-health.types';

@Pipe({
  name: 'appNotificationTitle'
})
export class NotificationTitlePipe implements PipeTransform {
  constructor(private _translate: TranslateService,
              private _severityToHealthPipe: SeverityToHealthPipe) {
  }
  
  transform(notification: StreamHealth): string {
    if (!notification) {
      return '';
    }
    
    const severity = this._severityToHealthPipe.transform(notification.severity);
    const streamType = this._translate.instant(`app.entryLive.${notification.isPrimary ? 'primary' : 'secondary'}`);
    const stream = this._translate.instant('app.entryLive.stream');
    return `${severity} ${streamType} ${stream}`;
  }
}
