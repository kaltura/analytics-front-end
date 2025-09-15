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
            sortOrder: 1,
          },
          'browser_family': {
            format: value => value,
            sortOrder: 1,
          },
          'count_plays': {
            format: value => value,
            sortOrder: 2,
          },
          'unique_viewers': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
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
