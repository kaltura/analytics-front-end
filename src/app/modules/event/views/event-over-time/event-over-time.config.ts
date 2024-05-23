import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import {getPrimaryColor, getSecondaryColor} from "shared/utils/colors";

@Injectable()
export class EventOverTimeConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'unique_event_attendees': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.event.attendees`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}%</span>`
          }
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'unique_event_attendees': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1,
          }
        }
      }
    };
  }

  public getMinutesConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'live_meeting_play_time': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.event.minutes`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}%</span>`
          }
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'live_meeting_play_time': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1,
          }
        }
      }
    };
  }
}
