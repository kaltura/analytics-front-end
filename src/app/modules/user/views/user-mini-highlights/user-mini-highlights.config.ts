import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig } from 'shared/services/storage-data-base.config';

@Injectable()
export class UserMiniHighlightsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      geoTable: {
        fields: {
          'country_code': {
            format: value => value,
          },
          'country': {
            format: value => value,
          },
          'region': {
            format: value => value,
          },
          'city': {
            format: value => value,
          },
        },
      },
      devicesTable: {
        fields: {
          'device': {
            format: value => value,
          },
          'count_plays': {
            format: value => parseInt(value, 10),
          },
        },
      },
      devicesTotal: {
        fields: {
          'count_plays': {
            format: value => parseInt(value, 10),
          },
        },
      }
    };
  }
}
