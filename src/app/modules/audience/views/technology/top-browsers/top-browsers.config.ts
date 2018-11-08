import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class TopBrowsersConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'browser': {
            format: value => value,
          },
          'count_plays': {
            format: value => value,
          },
          'avg_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
          }
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'count_plays': {
            format: value => parseFloat(value) || 0,
          },
        }
      }
    };
  }
}
