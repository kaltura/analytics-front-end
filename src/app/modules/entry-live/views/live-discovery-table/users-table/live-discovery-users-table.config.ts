import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GraphType, ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class LiveDiscoveryUsersTableConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      // device|view_unique_audience|view_unique_engaged_users|view_unique_buffering_users
      // |sum_view_time|avg_view_buffering|avg_view_engagement|known_flavor_params_view_count
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
          // 'avg_view_buffering': {
          //   format: value => value,
          //   sortOrder: 7,
          // },
          // 'avg_view_engagement': {
          //   format: value => value,
          //   sortOrder: 8,
          // },
        }
      }
    };
  }
}
