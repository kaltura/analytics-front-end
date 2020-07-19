import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniQualityConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'count_plays': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryWebcast.quality.buffer`),
            sortOrder: 1,
          },
          'unique_known_users': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryWebcast.quality.bitrate`),
            sortOrder: 2,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryWebcast.quality.minutes`),
            units: value => 'min',
            sortOrder: 3,
          }
        }
      }
    };
  }
}
