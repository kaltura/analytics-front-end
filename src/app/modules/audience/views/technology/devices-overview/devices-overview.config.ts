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
          'avg_view_period_time': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'sum_view_period': {
            format: value => value,
          },
          'unique_viewers': {
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
          'unique_viewers': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.unique_viewers`),
            tooltip: this._translate.instant(`app.audience.technology.unique_known_users_tt`),
            sortOrder: 2,
            colors: ['viewers'],
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.audience.technology.sum_view_period`),
            sortOrder: 3,
            colors: ['time'],
          },
          'avg_view_period_time': {
            format: value => value,
            title: this._translate.instant(`app.playlist.avg_view_period_time`),
            sortOrder: 4,
            colors: ['time'],
          }
        }
      }
    };
  }
}
