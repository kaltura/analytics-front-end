import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniTopStatsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'count_plays': {
            format: value => value,
            hidden: true,
          },
          'count_info': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'count_related_selected': {
            format: value => ReportHelper.numberOrZero(value),
          },
        }
      },
    };
  }
}
