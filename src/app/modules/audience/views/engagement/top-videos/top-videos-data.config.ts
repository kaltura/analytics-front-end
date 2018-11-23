import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';

@Injectable()
export class TopVideosDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'entry_name': {
            format: value => value,
            nonComparable: true,
          },
          'count_plays': {
            format: value => value,
          },
          'unique_known_users': {
            format: value => value,
          },
          'avg_view_drop_off': {
            format: value => value,
          },
          'sum_time_viewed': {
            format: value => value,
          },
        }
      }
    };
  }
}
