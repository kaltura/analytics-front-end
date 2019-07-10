import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import { KalturaEntryStatus } from 'kaltura-ngx-client';

@Injectable()
export class HighlightsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'count_plays': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.count_plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'sum_time_viewed': {
            format: value => value,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.sum_time_viewed`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_time_viewed': {
            format: value => value,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.avg_time_viewed`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_loads': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_completion_rate': {
            format: value => Math.min(value, 100),
            colors: [getPrimaryColor('dropoff'), getSecondaryColor('dropoff')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.avg_completion_rate`)}:&nbsp;${ReportHelper.percents(value / 100, false, true)}</span>`
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
            sortOrder: 1,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'avg_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            sortOrder: 6,
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.count_plays`),
            sortOrder: 1,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.sum_time_viewed`),
            sortOrder: 2,
          },
          'avg_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.avg_time_viewed`),
            sortOrder: 3,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.count_loads`),
            sortOrder: 4,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.user.avg_completion_rate`),
            sortOrder: 5,
          }
        }
      }
    };
  }
}
