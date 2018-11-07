import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';

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
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.count_plays`),
            tooltip: this._translate.instant(`app.audience.technology.count_plays_tt`),
          },
          'sum_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.sum_time_viewed`),
            tooltip: this._translate.instant(`app.audience.technology.sum_time_viewed_tt`),
          },
          'avg_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.avg_time_viewed`),
            tooltip: this._translate.instant(`app.audience.technology.avg_time_viewed_tt`),
          }
        }
      }
    };
  }
}
