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
          'name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'load_play_ratio': {
            format: value => ReportHelper.numberOrZero(Math.round(value * 100)) + '%',
            sortOrder: 2,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            sortOrder: 4,
          }
        }
      },
    };
  }
}
