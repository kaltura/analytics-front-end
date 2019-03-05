import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';

@Injectable()
export class VideoPerformanceConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'month_id': {
            format: value => DateFilterUtils.formatMonthString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'date_id': {
            format: value => DateFilterUtils.formatFullDateString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value, false, true),
          },
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.entry.plays`),
            sortOrder: 1,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'unique_known_users': {
            format: value => value,
            title: this._translate.instant(`app.entry.unique_known_users`),
            sortOrder: 2,
            colors: [getPrimaryColor('viewers'), getSecondaryColor('viewers')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.unique_known_users`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'sum_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.sum_time_viewed`),
            sortOrder: 3,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.sum_time_viewed`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_completion_rate': {
            format: value => Math.min(value, 100),
            title: this._translate.instant(`app.entry.avg_completion_rate`),
            sortOrder: 4,
            colors: [getPrimaryColor('dropoff'), getSecondaryColor('dropoff')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.avg_completion_rate`)}:&nbsp;${ReportHelper.percents(value / 100, false, true)}</span>`
          },
          'avg_view_drop_off': {
            format: value => Math.min(value * 100, 100),
            title: this._translate.instant(`app.entry.avg_view_drop_off`),
            sortOrder: 5,
            colors: [getPrimaryColor('dropoff'), getSecondaryColor('dropoff')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.avg_view_drop_off`)}:&nbsp;${ReportHelper.percents(value / 100, false)}</span>`
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_plays`),
            sortOrder: 1,
          },
          'unique_known_users': {
            format: value => value,
            title: this._translate.instant(`app.entry.unique_known_users`),
            sortOrder: 2,
          },
          'sum_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.sum_time_viewed`),
            sortOrder: 3,
          },
          'avg_completion_rate': {
            format: value => value,
            title: this._translate.instant(`app.entry.avg_completion_rate`),
            sortOrder: 4,
          },
          'avg_view_drop_off': {
            format: value => value,
            title: this._translate.instant(`app.entry.avg_view_drop_off`),
            sortOrder: 5,
          }
        }
      }
    };
  }
}
