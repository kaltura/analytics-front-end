import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class VideoPerformanceConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.entry.plays`),
            sortOrder: 1,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'sum_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.sum_time_viewed`),
            sortOrder: 2,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.sum_time_viewed`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.avg_time_viewed`),
            sortOrder: 3,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.avg_time_viewed`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_loads`),
            sortOrder: 4,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_plays`),
            tooltip: this._translate.instant(`app.entry.count_plays_tt`),
            sortOrder: 1,
          },
          'sum_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.sum_time_viewed`),
            tooltip: this._translate.instant(`app.entry.sum_time_viewed_tt`),
            sortOrder: 2,
          },
          'avg_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.avg_time_viewed`),
            tooltip: this._translate.instant(`app.entry.avg_time_viewed_tt`),
            sortOrder: 3,
          },
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_loads`),
            tooltip: this._translate.instant(`app.entry.count_loads_tt`),
            sortOrder: 4,
          }
        }
      }
    };
  }
}
