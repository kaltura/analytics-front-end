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
          },
          'count_loads': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
          },
          'load_play_ratio': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
          },
          'sum_time_viewed': {
            format: value => value,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
          },
          'avg_view_drop_off': {
            format: value => value,
            colors: [getPrimaryColor('dropoff'), getSecondaryColor('dropoff')],
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
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'load_play_ratio': {
            format: value => ReportHelper.numberOrZero(value * 100) + '%',
            sortOrder: 5,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 6,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.numberOrZero(value * 100) + '%',
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
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.count_plays_tt`),
            sortOrder: 1,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.count_loads`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.count_loads_tt`),
            sortOrder: 2,
          },
          'load_play_ratio': {
            format: value => ReportHelper.numberOrZero(value * 100),
            title: this._translate.instant(`app.engagement.topDomainsReport.load_play_ratio`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.load_play_ratio_tt`),
            sortOrder: 3,
            units: value => '%',
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.sum_time_viewed`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.sum_time_viewed_tt`),
            units: value => 'Min',
            sortOrder: 4,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.numberOrZero(value * 100),
            title: this._translate.instant(`app.engagement.topDomainsReport.avg_view_drop_off`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.avg_view_drop_off_tt`),
            units: value => '%',
            sortOrder: 5,
          },
        }
      },
    };
  }
}
