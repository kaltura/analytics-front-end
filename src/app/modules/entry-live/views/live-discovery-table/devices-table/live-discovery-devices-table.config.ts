import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GraphType, ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class LiveDiscoveryDevicesTableConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'device': {
            format: value => value,
            sortOrder: 1,
          },
          'view_unique_audience': {
            format: value => value,
            sortOrder: 2,
          },
          'view_unique_buffering_users': {
            format: value => value,
            sortOrder: 4,
          },
          'sum_view_time': {
            format: value => `${ReportHelper.numberOrZero(value / 60)} Min`,
            sortOrder: 5,
          },
          'known_flavor_params_view_count': {
            format: value => value,
            sortOrder: 6,
          },
          'view_unique_engaged_users': {
            format: value => value,
            sortOrder: 3,
          },
        }
      }
    };
  }
}
