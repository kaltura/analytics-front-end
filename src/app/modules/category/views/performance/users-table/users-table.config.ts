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
          'name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value, true, true),
            sortOrder: 5,
          },
          'avg_completion_rate': {
            format: value =>  ReportHelper.percents(value / 100, false, true),
            sortOrder: 6,
          },
          'total_completion_rate': {
            format: value =>  ReportHelper.percents(value / 100, false, true),
            sortOrder: 7,
          },
        }
      }
    };
  }
}
