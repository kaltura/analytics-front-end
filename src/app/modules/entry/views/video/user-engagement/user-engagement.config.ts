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
          'partner_id': {
            format: value => value,
            hidden: true,
          },
          'full_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'name': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            sortOrder: 4,
          },
          'total_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            sortOrder: 5,
          }
        }
      },
    };
  }
}
