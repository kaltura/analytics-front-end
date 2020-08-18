import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniEngagementConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'live_engaged_users_play_time_ratio': {
            format: value => ReportHelper.percents(value, false, true),
            title: this._translate.instant(`app.entryWebcast.engagement.live`),
            tooltip: this._translate.instant(`app.entryWebcast.engagement.live_tt`),
            sortOrder: 1,
          },
         'avg_vod_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.entryWebcast.engagement.vod`),
            tooltip: this._translate.instant(`app.entryWebcast.engagement.vod_tt`),
            sortOrder: 2,
          },
          'registered': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryWebcast.engagement.registered`),
            sortOrder: 3,
          }
        }
      }
    };
  }
}
