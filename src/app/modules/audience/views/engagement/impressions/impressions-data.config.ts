import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { fileSize } from 'shared/utils/file-size';

@Injectable()
export class ImpressionsDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'count_loads': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays_25': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays_50': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays_75': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays_100': {
            format: value => ReportHelper.numberOrNA(value)
          }
        }
      }
    };
  }
}
