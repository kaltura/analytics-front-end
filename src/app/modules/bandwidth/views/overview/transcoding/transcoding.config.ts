import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class TranscodingConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'flavor_params_id': {
            format: value => value,
            sortOrder: 1,
          },
          'name': {
            format: value => value,
            sortOrder: 2,
          },
          'transcoding_consumption': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'transcoding_duration': {
            format: value => ReportHelper.numberOrZero(ReportHelper.hours(value), false, 2),
            sortOrder: 4,
          }
        }
      }
    };
  }
}
