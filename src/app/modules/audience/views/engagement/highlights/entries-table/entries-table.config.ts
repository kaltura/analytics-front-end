import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class EntriesTableConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value, true, true),
            sortOrder: 5,
          },
        }
      }
    };
  }
}
