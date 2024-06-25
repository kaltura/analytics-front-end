import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class SessionsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'event_session_context_id': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 2,
          },
          'unique_combined_live_viewers': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'combined_live_engaged_users_ratio': {
            format: value => ReportHelper.percents(value, false, true),
            sortOrder: 4,
          },
          'unique_vod_viewers': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5,
          },
          'avg_vod_completion_rate': {
            format: value => ReportHelper.percents(value / 100, true, true),
            sortOrder: 6,
          },
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'unique_combined_live_viewers': {
            format: value => ReportHelper.numberOrZero(value)
          }
        }
      }
    };
  }
}
