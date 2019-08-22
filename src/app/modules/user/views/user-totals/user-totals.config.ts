import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class UserTotalsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        preSelected: 'count_loads',
        fields: {
          'count_loads': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.user.count_loads`),
            sortOrder: 1,
            icon: 'icon-small-impressions',
            iconColor: 'aqua',
          },
          'count_plays': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.user.count_plays`),
            sortOrder: 2,
            icon: 'icon-small-play',
            iconColor: 'blue',
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.sum_time_viewed`),
            sortOrder: 3,
            icon: 'icon-small-time',
            iconColor: 'orange',
          },
          'avg_completion_rate': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.avg_completion_rate`),
            sortOrder: 4,
            icon: 'icon-progress',
            iconColor: 'green',
          },
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.added_entries`),
            sortOrder: 5,
            icon: 'icon-small-contribution',
            iconColor: 'violet',
          },
          'count_viral': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.count_viral`),
            hidden: true,
          },
        }
      }
    };
  }
}
