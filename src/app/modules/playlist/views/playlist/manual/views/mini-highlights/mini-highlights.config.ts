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
          'count_plays': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_plays`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.count_plays_tt`),
            sortOrder: 1,
          },
          'unique_viewers': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.unique_viewers`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.unique_known_users_tt`),
            sortOrder: 2,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.sum_time_viewed`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.sum_time_viewed_tt`),
            units: value => 'min',
            sortOrder: 3,
          },
          'unique_played_videos': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.playlist.played`),
            tooltip: this._translate.instant(`app.playlist.played`),
            sortOrder: 4,
          },
          // 'unique_owners': {
          //   format: value => ReportHelper.integerOrZero(value),
          //   title: this._translate.instant(`app.playlist.avgPlays`),
          //   tooltip: this._translate.instant(`app.playlist.avgPlays`),
          //   sortOrder: 5,
          // }
        }
      }
    };
  }
}
