import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';

@Injectable()
export class TopContributorsDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
            sortOrder: 1,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value),
            sortOrder: 4,
          },
        }
      }
    };
  }
}
