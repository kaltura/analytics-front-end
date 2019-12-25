import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { KalturaEntryStatus } from 'kaltura-ngx-client';

@Injectable()
export class UserMiniTopContentConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
          },
          'entry_source': {
            format: value => value,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
          },
          'status': {
            format: value => value,
          },
        }
      },
    };
  }
}
