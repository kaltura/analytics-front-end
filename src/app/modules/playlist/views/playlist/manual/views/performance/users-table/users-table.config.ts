import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class UsersTableConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'partner_id': {
            format: value => value,
            nonComparable: true,
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
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'unique_videos': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'avg_completion_rate': {
            format: value =>  ReportHelper.percents(value / 100, false, true),
            sortOrder: 6,
          }
        }
      }
    };
  }
}
