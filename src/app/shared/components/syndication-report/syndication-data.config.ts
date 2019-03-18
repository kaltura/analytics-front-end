import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class SyndicationDataConfig extends ReportDataBaseConfig {
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
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.topDomainsReport.count_plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_loads': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.topDomainsReport.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'load_play_ratio': {
            format: value => value,
            parse: value => Math.round(parseFloat(value) * 100),
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.topDomainsReport.load_play_ratio`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}%</span>`
          },
          'sum_time_viewed': {
            format: value => value,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.topDomainsReport.sum_time_viewed`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)} Min</span>`
          },
          'avg_view_drop_off': {
            format: value => Math.min(value, 100),
            parse: value => Math.min(Math.round(parseFloat(value) * 100), 100),
            colors: [getPrimaryColor('dropoff'), getSecondaryColor('dropoff')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.topDomainsReport.avg_view_drop_off`)}:&nbsp;${value}%</span>`
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'domain_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'referrer': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'count_plays': {
            format: value => value,
            sortOrder: 2,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'load_play_ratio': {
            format: value => ReportHelper.numberOrZero(Math.round(value * 100)) + '%',
            sortOrder: 5,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 6,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value, true, true),
            sortOrder: 6,
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.count_plays`),
            sortOrder: 1,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.count_loads`),
            sortOrder: 2,
          },
          'load_play_ratio': {
            format: value => ReportHelper.numberOrZero(Math.round(value * 100)),
            title: this._translate.instant(`app.engagement.topDomainsReport.load_play_ratio`),
            sortOrder: 3,
            units: value => '%',
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.sum_time_viewed`),
            units: value => 'Min',
            sortOrder: 4,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.numberOrZero(Math.round(value * 100)),
            title: this._translate.instant(`app.engagement.topDomainsReport.avg_view_drop_off`),
            units: value => '%',
            sortOrder: 5,
          },
        }
      },
    };
  }
}
