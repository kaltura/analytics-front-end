import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class UserEngagementConfig extends ReportDataBaseConfig {
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
          'registered': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrNA(value),
            sortOrder: 5
          },
         'sum_live_view_period': {
            format: value => ReportHelper.numberOrNA(value),
            sortOrder: 6
          },
          'avg_live_buffer_time': {
            format: value => ReportHelper.percents(value, false, true),
            sortOrder: 7
          },
          'live_engaged_users_play_time_ratio': {
            format: value => ReportHelper.percents(value, false, true),
            sortOrder: 8
          },
          'total_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            sortOrder: 9
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'count_plays',
        fields: {
          'registered': {
            format: value => ReportHelper.numberOrNA(value)
          },
         'count_loads': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'sum_live_view_period': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'avg_live_buffer_time': {
            format: value => ReportHelper.percents(value, false, true),
          },
          'live_engaged_users_play_time_ratio': {
            format: value => ReportHelper.percents(value, false, true),
          }
        }
      }
    };
  }
}
