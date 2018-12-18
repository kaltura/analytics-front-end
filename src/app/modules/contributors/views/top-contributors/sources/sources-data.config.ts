import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class SourcesDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'added_entries': {
            format: value => value,
            sortOrder: 1,
          },
          'added_msecs': {
            format: value => value,
            sortOrder: 2,
          },
          'contributors': {
            format: value => value,
            sortOrder: 3,
          },
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'added_entries': {
            format: value => value,
            color: [getPrimaryColor('entries'), getSecondaryColor('entries')],
          },
          'added_msecs': {
            format: value => value,
            color: [getPrimaryColor('time'), getSecondaryColor('time')],
          },
          'contributors': {
            format: value => value,
            color: [getPrimaryColor('viewers'), getSecondaryColor('viewers')],
          },
        }
      }
    };
  }
}
