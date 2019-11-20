import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { TopCountriesConfig } from '../../shared/top-countries/top-countries.config';

@Injectable()
export class ImageTopCountriesConfig extends TopCountriesConfig {
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
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'count_loads',
        fields: {
          'count_loads': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entry.count_loads`),
          },
        }
      }
    };
  }
}
