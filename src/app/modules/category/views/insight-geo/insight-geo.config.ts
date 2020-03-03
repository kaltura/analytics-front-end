import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class InsightGeoConfig extends ReportDataBaseConfig {
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
          },
          'country': {
            format: value => value,
            nonComparable: true,
          },
          'region': {
            format: value => value,
            nonComparable: true,
          },
          'city': {
            format: value => value,
            nonComparable: true,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'coordinates': {
            format: value => value
          }
        }
      }
    };
  }
}
