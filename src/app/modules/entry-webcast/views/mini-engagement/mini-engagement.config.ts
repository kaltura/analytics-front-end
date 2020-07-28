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
          'avg_vod_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.entryWebcast.engagement.vod`),
            sortOrder: 1,
          },
          'registered': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryWebcast.engagement.registered`),
            sortOrder: 2,
          }
        }
      }
    };
  }
}
