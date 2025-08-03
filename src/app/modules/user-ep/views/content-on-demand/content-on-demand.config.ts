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
          'sum_view_period': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 6,
          },
          'total_completion_rate': {
            format: value => ReportHelper.percents(value / 100, true, true),
            sortOrder: 7,
          },
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1,
          }
        }
      }
    };
  }
}
