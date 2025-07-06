import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';

@Injectable()
export class UserInsightPlaysConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'date_id': {
            format: value => DateFilterUtils.parseDateString(value).format('MMM DD, YYYY'),
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'count_plays': {
            format: value => parseInt(value, 10),
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
          },
        }
      },
      [ReportDataSection.graph]: {
        fields: {}
      },
    };
  }
}
