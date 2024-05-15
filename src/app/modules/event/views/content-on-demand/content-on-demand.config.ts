import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class ContentOnDemandConfig extends ReportDataBaseConfig {
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
          'object_id': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'entry_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 2,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'unique_viewers': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 6,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, true, true),
            sortOrder: 7,
          },
        }
      }
    };
  }
}
