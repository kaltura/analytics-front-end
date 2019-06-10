import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';

export enum UserStatus {
  offline = 'offline',
  dvr = 'dvr',
  live = 'live',
}

@Injectable()
export class LiveDiscoveryUsersStatusConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'user_id': {
            format: value => value,
          },
          'playback_type': {
            format: value => value,
          },
        }
      },
      'totalsTable': {
        fields: {
          'playback_type': {
            format: value => UserStatus[value] ? UserStatus[value] : UserStatus.offline,
          },
          'sum_view_time': {
            format: value => value,
          },
        }
      },
    };
  }
}
