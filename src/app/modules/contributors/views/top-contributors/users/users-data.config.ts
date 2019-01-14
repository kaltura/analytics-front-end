import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class UsersDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'month_id': {
            format: value => value,
            hidden: true,
          },
          'unique_contributors': {
            format: value => value,
            sortOrder: 1,
          }
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'default': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
          }
        }
      }
    };
  }
}
