import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class EntriesTableConfig extends ReportDataBaseConfig {
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
          'unique_viewers': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.unique_known_users`),
            sortOrder: 2,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            title: this._translate.instant(`app.engagement.topDomainsReport.avg_completion_rate`),
            tooltip: this._translate.instant(`app.engagement.topDomainsReport.avg_completion_rate_tt`),
            sortOrder: 3,
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'entry_id': {
            format: value => value,
            nonComparable: true,
            sortOrder: 0,
          },
          'entry_name': {
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
          'unique_viewers': {
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
