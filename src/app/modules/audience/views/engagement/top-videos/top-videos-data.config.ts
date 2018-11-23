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
          'object_id': {
            format: value => value,
            hidden: true,
            nonComparable: true,
          },
          'entry_name': {
            format: value => value,
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value),
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
          },
        }
      }
    };
  }
}
