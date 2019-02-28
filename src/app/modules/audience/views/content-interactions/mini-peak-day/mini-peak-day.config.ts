import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';

@Injectable()
export class MiniPeakDayConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'date_id': {
            format: value => DateFilterUtils.formatMonthDayString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
          }
        }
      }
    };
  }
}
