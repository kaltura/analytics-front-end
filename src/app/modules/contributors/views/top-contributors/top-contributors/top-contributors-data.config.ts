import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';

@Injectable()
export class TopContributorsDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'user_id': {
            format: value => value,
            sortOrder: 1,
            nonComparable: true,
            hidden: true,
          },
          'partner_id': {
            format: value => value,
          },
          'creator_name': {
            format: value => value,
            sortOrder: 1,
          },
          'created_at': {
            format: value => ReportHelper.format('serverDate', value),
            sortOrder: 1,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1,
          },
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1,
          },
          'added_msecs': {
            format: value => ReportHelper.numberOrZero(ReportHelper.minutes(value)),
            sortOrder: 1,
          },
          'contributor_ranking': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1,
          }
        }
      }
    };
  }
}
