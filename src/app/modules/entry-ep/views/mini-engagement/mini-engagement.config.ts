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
          },
          'count_reaction_clicked': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 3,
          },
          'download_attachment_user_ratio': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 4,
          },
          'count_download_attachment_clicked': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 5,
          }
        }
      }
    };
  }

  public getCncConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'reaction_clicked_participation': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 1,
          },
          'count_reaction_clicked': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 2,
          },
          'group_participation': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 3,
          },
          'count_cnc_group_message_sent': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 4,
          },
          'q_and_a_participation': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 5,
          },
          'q_and_a_threads_count': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 6,
          },
          'poll_participation': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 7,
          }
        }
      }
    };
  }
}
