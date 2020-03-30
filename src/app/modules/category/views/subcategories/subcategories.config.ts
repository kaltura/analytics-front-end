import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class SubcategoriesConfig extends ReportDataBaseConfig {
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
          'entries_count': {
            format: value => ReportHelper.numberOrZero(value),
            nonComparable: true,
            hidden: true,
          },
          'direct_sub_categories_count': {
            format: value => ReportHelper.numberOrZero(value),
            nonComparable: true,
            hidden: true,
          },
          'parent_name': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'unique_viewers': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
          fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
              title: this._translate.instant(`app.engagement.topDomainsReport.count_plays`),
              sortOrder: 1,
          }
        }
      }
    };
  }
}
