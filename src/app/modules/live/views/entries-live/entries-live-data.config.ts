import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class EntriesLiveDataConfig extends ReportDataBaseConfig {
  private translate: TranslateService;
  
  constructor(_translate: TranslateService) {
    super(_translate);
    this.translate = _translate;
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
            sortOrder: 1,
          },
          'creator_name': {
            format: value => value,
            sortOrder: 2,
          },
          'created_at': {
            format: value => ReportHelper.format('serverDate', value),
            sortOrder: 3,
          },
        }
      },
    };
  }
}
