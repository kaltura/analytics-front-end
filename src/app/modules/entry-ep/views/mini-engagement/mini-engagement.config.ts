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
          'combined_live_engaged_users_play_time_ratio': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 1,
          },
          'reaction_clicked_user_ratio': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 2,
          }
        }
      }
    };
  }
}
