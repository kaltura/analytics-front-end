import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class VideoPerformanceConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.entry.plays`),
            sortOrder: 1,
          },
          'sum_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.sum_time_viewed`),
            sortOrder: 2,
          },
          'avg_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.avg_time_viewed`),
            sortOrder: 3,
          },
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_loads`),
            sortOrder: 4,
          },
        }
      }
    };
  }
}
