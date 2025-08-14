import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
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
          'count_loads': {
            format: value => value,
            colors: [getPrimaryColor('impressions'), getSecondaryColor('impressions')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.highlightsReport.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'sum_view_period': {
            format: value => value,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.highlightsReport.sum_view_period`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'unique_known_users': {
            format: value => value,
            colors: [getPrimaryColor('viewers'), getSecondaryColor('viewers')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.highlightsReport.unique_known_users`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_completion_rate': {
            format: value => Math.min(value, 100),
            title: this._translate.instant(`app.entry.avg_completion_rate`),
            sortOrder: 4,
            colors: [getPrimaryColor('dropoff'), getSecondaryColor('dropoff')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.avg_completion_rate`)}:&nbsp;${ReportHelper.percents(value / 100, false, true)}</span>`
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_loads',
        fields: {
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_loads`),
            sortOrder: 0,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_plays`),
            sortOrder: 1,
          },
          'unique_known_users': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.unique_known_users`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.unique_known_users_tt`),
            sortOrder: 2,
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.sum_view_period`),
            units: value => 'min',
            sortOrder: 3,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            title: this._translate.instant(`app.engagement.topDomainsReport.avg_completion_rate`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.avg_completion_rate_tt`),
            sortOrder: 5,
          },
        }
      }
    };
  }
}
