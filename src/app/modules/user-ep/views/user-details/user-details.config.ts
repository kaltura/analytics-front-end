import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class UserDetailsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'user_id': {
            format: value => value,
            hidden: true,
          },
          'user_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1
          },
          'title': {
            format: value => value,
            hidden: true,
          },
          'company': {
            format: value => value,
            hidden: true,
          },
          'country': {
            format: value => value,
            hidden: true,
          },
          'role': {
            format: value => value,
            hidden: true,
          },
          'industry': {
            format: value => value,
            hidden: true,
          }
        }
      }
    };
  }

}
