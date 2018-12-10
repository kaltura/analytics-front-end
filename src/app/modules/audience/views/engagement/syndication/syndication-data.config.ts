import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class SyndicationDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'month_id': {
            format: value => value
          },
          'date_id': {
            format: value => value
          },
          'bandwidth_consumption': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
            units: value => 'MB',
          },
          'average_storage': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
            units: value => 'MB',
          },
          'peak_storage': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
            units: value => 'MB',
          },
          'added_storage': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
            units: value => 'MB',
          },
          'deleted_storage': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
            units: value => 'MB',
          },
          'combined_bandwidth_storage': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
            units: value => 'MB',
          },
          'transcoding_consumption': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
            units: value => 'MB',
          }
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
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'avg_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            units: value => 'MB',
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            units: value => 'MB',
          },
          'load_play_ratio': {
            format: value => ReportHelper.numberOrZero(value),
            units: value => 'MB',
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.count_plays`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.count_plays_tt`),
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.count_loads`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.count_loads_tt`),
          },
          'load_play_ratio': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.load_play_ratio`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.load_play_ratio_tt`),
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.sum_time_viewed`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.sum_time_viewed_tt`),
          },
        }
      },
    };
  }
}
