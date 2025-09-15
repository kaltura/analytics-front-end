import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniHighlightsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'unique_videos': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.dimensions.entries`),
            tooltip: this._translate.instant(`app.engagement.dimensions.entries_tt`),
            sortOrder: 3,
          },
          'count_loads': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_loads`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.count_loads_tt`),
            sortOrder: 1,
          },
          'count_plays': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_plays`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.count_plays_tt`),
            sortOrder: 2,
          },
          'sum_view_period': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.sum_view_period`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.sum_view_period_tt`),
            units: value => 'min',
            sortOrder: 5,
          },
          'unique_viewers': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.unique_viewers`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.unique_known_users_tt`),
            sortOrder: 4,
          },
          'unique_owners': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.unique_owners`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.unique_owners`),
            sortOrder: 6,
          }
        }
      }
    };
  }
}
