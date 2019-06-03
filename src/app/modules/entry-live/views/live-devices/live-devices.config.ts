import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class LiveDevicesConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'device': {
            format: value => value,
          },
          'view_unique_audience': {
            format: value => value,
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'view_unique_audience',
        fields: {
          'view_unique_audience': {
            format: value => value,
          }
        }
      }
    };
  }
}
