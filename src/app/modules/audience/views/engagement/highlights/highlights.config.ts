import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

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
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.highlightsReport.count_plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'sum_time_viewed': {
            format: value => value,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.highlightsReport.sum_time_viewed`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'unique_known_users': {
            format: value => value,
            colors: [getPrimaryColor('viewers'), getSecondaryColor('viewers')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.highlightsReport.unique_known_users`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_view_drop_off': {
            format: value => Math.min(value, 100),
            parse: value => Math.min(Math.round(parseFloat(value) * 100), 100),
            colors: [getPrimaryColor('dropoff'), getSecondaryColor('dropoff')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.highlightsReport.avg_view_drop_off`)}:&nbsp;${value}%</span>`
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'month_id': {
            format: value => DateFilterUtils.formatMonthString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'date_id': {
            format: value => DateFilterUtils.formatFullDateString(value),
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value, true, true),
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_plays`),
            sortOrder: 1,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.sum_time_viewed`),
            units: value => 'min',
            sortOrder: 3,
          },
          'unique_known_users': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.unique_known_users`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.unique_known_users_tt`),
            sortOrder: 2,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value, true, true),
            units: value => '%',
            title: this._translate.instant(`app.engagement.highlightsReport.avg_view_drop_off`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.avg_view_drop_off_tt`),
            sortOrder: 4,
          }
        }
      }
    };
  }
}
