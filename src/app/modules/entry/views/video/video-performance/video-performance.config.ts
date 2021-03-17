import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getColorPalette, getPrimaryColor, getSecondaryColor} from 'shared/utils/colors';
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
            sortOrder: 1,
          },
          'date_id': {
            format: value => DateFilterUtils.formatFullDateString(value),
            nonComparable: true,
            sortOrder: 1,
          },
          'hours_id': {
            format: value => DateFilterUtils.formatHoursString(value),
            nonComparable: true,
            sortOrder: 1,
          },
          'full_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'name': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'unique_viewers': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            sortOrder: 6,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 7,
          },
          'total_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            sortOrder: 8,
          },
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_plays`),
            sortOrder: 0,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.count_plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_loads`),
            sortOrder: 1,
            colors: [getPrimaryColor('impressions'), getSecondaryColor('impressions')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'unique_viewers': {
            format: value => value,
            title: this._translate.instant(`app.entry.unique_viewers`),
            sortOrder: 2,
            colors: [getPrimaryColor('viewers'), getSecondaryColor('viewers')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.unique_viewers`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
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
            colors: [getPrimaryColor('moderation'), getSecondaryColor('moderation')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.avg_view_drop_off`)}:&nbsp;${ReportHelper.percents(value / 100, false)}</span>`
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_loads',
        fields: {
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_loads`),
            sortOrder: 1,
          },
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_plays`),
            sortOrder: 2,
          },
          'unique_viewers': {
            format: value => value,
            title: this._translate.instant(`app.entry.unique_viewers`),
            tooltip: this._translate.instant('app.entry.unique_known_users_tt'),
            sortOrder: 3,
          },
          'sum_time_viewed': {
            format: value => value,
            title: this._translate.instant(`app.entry.sum_time_viewed`),
            sortOrder: 4,
          },
          'avg_completion_rate': {
            format: value => value,
            title: this._translate.instant(`app.entry.avg_completion_rate`),
            tooltip: this._translate.instant('app.entry.avg_completion_rate_tt'),
            sortOrder: 5,
          },
          'avg_view_drop_off': {
            format: value => value,
            title: this._translate.instant(`app.entry.avg_view_drop_off`),
            tooltip: this._translate.instant('app.entry.avg_view_drop_off_tt'),
            sortOrder: 6,
          }
        }
      }
    };
  }
}
