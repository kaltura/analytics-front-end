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
      // TODO update config according to the server headers
      [ReportDataSection.table]: {
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'added_msecs': {
            format: value => ReportHelper.percents(value),
            sortOrder: 4,
          },
        }
      }
    };
  }
}
