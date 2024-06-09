import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniProfileConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'registered_unique_users': {
            format: value => value,
          }
        }
      }
    };
  }

  public getCountriesConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'country': {
            format: value => value,
          },
          'registered_unique_users': {
            format: value => value,
          }
        }
      }
    };
  }
  public getRolesConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'role': {
            format: value => value,
          },
          'registered_unique_users': {
            format: value => value,
          }
        }
      }
    };
  }

  public getIndustriesConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'industry': {
            format: value => value,
          },
          'registered_unique_users': {
            format: value => value,
          }
        }
      }
    };
  }

}
