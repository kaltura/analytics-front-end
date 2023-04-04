import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniMinutesViewedConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'vod_live_view_time': {
            format: value => ReportHelper.numberOrZero(value, false),
            title: this._translate.instant(`app.entryEp.highlights.avgMinutes`),
            sortOrder: 1,
          },
          'live_view_time': {
            format: value => ReportHelper.numberOrZero(value, false),
            title: this._translate.instant(`app.entryEp.highlights.live`),
            sortOrder: 2,
          },
          'vod_view_time': {
            format: value => ReportHelper.numberOrZero(value, false),
            title: this._translate.instant(`app.entryEp.highlights.recordings`),
            sortOrder: 3,
          }
        }
      }
    };
  }
}
