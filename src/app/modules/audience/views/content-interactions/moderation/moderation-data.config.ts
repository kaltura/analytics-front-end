import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { EChartOption } from 'echarts';
import { ReportHelper } from 'shared/services';

@Injectable()
export class ModerationDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'reason': {
            format: value => value === '0' ? this._translate.instant('app.contentInteractions.otherReason') : value,
          },
          'count_report_submitted': {
            format: value => ReportHelper.numberOrZero(value),
          },
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'count_report_submitted': {
            format: value => ReportHelper.numberOrZero(value),
          },
        }
      },
    };
  }
}
