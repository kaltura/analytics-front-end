import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class ViewerEngagementConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'user_id': {
            format: value => value,
            hidden: true,
          },
          'user_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1
          },
          'live_view_time': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2
          },
          'count_reaction_clicked': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3
          },
          'count_group_chat_messages_sent': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4
          },
          'count_poll_answered': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5
          },
          'combined_live_engaged_users_play_time_ratio': {
            format: value => ReportHelper.percents(value, false, true),
            sortOrder: 8
          },
          'title': {
            format: value => value,
            hidden: true,
          },
          'company': {
            format: value => value,
            hidden: true,
          },
          'country': {
            format: value => value,
            hidden: true,
          },
          'role': {
            format: value => value,
            hidden: true,
          },
          'industry': {
            format: value => value,
            hidden: true,
          },
          'count_raise_hand_clicked': {
            format: value => ReportHelper.numberOrZero(value),
            hidden: true,
          },
          'count_q_and_a_threads': {
            format: value => ReportHelper.numberOrZero(value),
            hidden: true,
          },
          'count_download_attachment_clicked': {
            format: value => ReportHelper.numberOrZero(value),
            hidden: true,
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'live_view_time',
        fields: {
          'live_view_time': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1
          },
         'count_reaction_clicked': {
            format: value => ReportHelper.numberOrZero(value),
           sortOrder: 2
          },
          'count_group_chat_messages_sent': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3
          },
          'count_poll_answered': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4
          },
          'combined_live_engaged_users_play_time_ratio': {
            format: value => ReportHelper.percents(value, false, true),
            sortOrder: 5
          }
        }
      }
    };
  }
}
