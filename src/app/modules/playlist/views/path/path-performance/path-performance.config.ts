import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getColorPalette, getPrimaryColor, getSecondaryColor} from 'shared/utils/colors';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';

@Injectable()
export class PathPerformanceConfig extends ReportDataBaseConfig {
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
          'name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'unique_known_users': {
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
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.playlist.count_plays`),
            sortOrder: 0,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.count_plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.playlist.count_loads`),
            sortOrder: 1,
            colors: [getPrimaryColor('impressions'), getSecondaryColor('impressions')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'sum_view_period': {
            format: value => value,
            title: this._translate.instant(`app.playlist.sum_view_period`),
            sortOrder: 2,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.playlist.sum_view_period`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_view_period_time': {
            format: value => value,
            title: this._translate.instant(`app.playlist.avg_view_period_time`),
            sortOrder: 2,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.playlist.avg_view_period_time`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },

        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_loads',
        fields: {
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.playlist.count_loads`),
            sortOrder: 1,
          },
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.playlist.count_plays`),
            sortOrder: 2,
          },
          'sum_view_period': {
            format: value => value,
            title: this._translate.instant(`app.playlist.sum_view_period`),
            sortOrder: 3,
          },
          'avg_view_period_time': {
            format: value => value,
            title: this._translate.instant(`app.playlist.avg_view_period_time`),
            sortOrder: 3,
          },
        }
      }
    };
  }
}
