import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class UsersTableConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_plays`),
            sortOrder: 0,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_loads`),
            sortOrder: 1,
          },
          'sum_vod_view_period': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.sum_time_viewed`),
            units: value => 'min',
            sortOrder: 2,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            title: this._translate.instant(`app.engagement.topDomainsReport.avg_completion_rate`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.avg_completion_rate_tt`),
            sortOrder: 4,
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'partner_id': {
            format: value => value,
            nonComparable: true,
            hidden: true,
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
          'sum_vod_view_period': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            sortOrder: 5,
          },
        }
      }
    };
  }
}
