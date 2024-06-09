import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniTopMomentConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'entry_id': {
            format: value => value,
          },
          'entry_name': {
            format: value => value,
          },
          'position': {
            format: value => value,
          },
          'combined_live_view_period_count': {
            format: value => ReportHelper.numberOrZero(value)
          },
        }
      }
    };
  }
}
