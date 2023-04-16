import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class SessionConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'position': {
            format: value => value,
            sortOrder: 0,
          },
          'combined_live_view_period_count': {
            format: value => value,
            sortOrder: 0,
          },
          'combined_live_engaged_users_ratio': {
            format: value => value,
            sortOrder: 0,
          }
        }
      }
    };
  }
}
