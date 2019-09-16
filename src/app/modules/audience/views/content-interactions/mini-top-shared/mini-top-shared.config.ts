import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniTopSharedConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
            nonComparable: true,
          },
          'partner_id': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'count_viral': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'status': {
            format: value => value,
            hidden: true,
          },
        }
      }
    };
  }
}
