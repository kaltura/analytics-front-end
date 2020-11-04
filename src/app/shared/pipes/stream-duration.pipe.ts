import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';

@Pipe({
  name: 'appStreamDuration'
})
export class StreamDurationPipe implements PipeTransform {
  constructor(private _translate: TranslateService) {
  }

  transform(duration: moment.Duration, showWhenEmpty = true): string {
    let timeString = showWhenEmpty ? '00:00:00' : '';

    if (duration) {
      if (duration.months() > 0) {
        timeString = this._translate.instant('app.entryLive.stream_duration_in_months', { months: duration.months(), days: duration.days() });
      } else if (duration.days() > 0) {
        timeString = this._translate.instant('app.entryLive.stream_duration_in_days', { days: duration.days(), hours: duration.hours() });
      } else {
        timeString = this._padTo2Digits(duration.hours()) + ':' + this._padTo2Digits(duration.minutes()) + ':' + this._padTo2Digits(duration.seconds());
      }
    }

    return timeString;
  }

  private _padTo2Digits(number: number): string {
    return ((0 <= number && number < 10) ? '0' : '') + number;
  }
}
