import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniTopSourcesConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'source': {
            format: value => value,
            sortOrder: 1,
          },
          'added_entries': {
            format: value => value,
            sortOrder: 1,
          },
          'added_msecs': {
            format: value => ReportHelper.minutes(value),
            sortOrder: 2,
          },
          'unique_contributors': {
            format: value => value,
            sortOrder: 3,
          }
        }
      }
    };
  }
}
