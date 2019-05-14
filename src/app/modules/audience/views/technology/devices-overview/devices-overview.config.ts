import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class DevicesOverviewConfig extends ReportDataBaseConfig {
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
          'count_plays': {
            format: value => value,
          },
          'avg_time_viewed': {
            format: value => value,
          },
          'sum_time_viewed': {
            format: value => value,
          },
          'unique_known_users': {
            format: value => value,
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.count_plays`),
            sortOrder: 1,
            colors: ['default'],
          },
          'unique_known_users': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.unique_known_users`),
            tooltip: this._translate.instant(`app.audience.technology.unique_known_users_tt`),
            sortOrder: 2,
            colors: ['viewers'],
          },
          'sum_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.sum_time_viewed`),
            sortOrder: 3,
            colors: ['time'],
          },
          'avg_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.avg_time_viewed`),
            sortOrder: 4,
            colors: ['time'],
          },
        }
      }
    };
  }
}
