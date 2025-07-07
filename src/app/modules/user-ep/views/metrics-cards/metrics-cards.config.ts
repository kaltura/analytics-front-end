import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MetricsCardsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'total_view_time': {
            format: value => ReportHelper.integerOrZero(value ),
            sortOrder: 1,
          },
          'combined_live_engaged_users_play_time_ratio': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 2,
          },
          'count_reaction_clicked': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 3,
          },
          'count_download_attachment_clicked': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 4,
          },
          'count_group_chat_messages_sent': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 5,
          },
          'count_q_and_a_threads': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 6,
          },
          'count_poll_answered': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 7,
          },
        }
      }
    };
  }

  public getCncConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'reaction_clicked_unique_users': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 1,
          },
          'count_reaction_clicked': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 2,
          },
          'unique_users_sent_group_message': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 3,
          },
          'count_cnc_group_message_sent': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 4,
          },
          'unique_users_q_and_a_thread': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 5,
          },
          'q_and_a_threads_count': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 6,
          },
          'unique_users_answered_poll': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 7,
          },
          'unique_users_sent_private_message': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 8,
          },
          'unique_logged_in_users': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 9,
          },
        }
      }
    };
  }
}
