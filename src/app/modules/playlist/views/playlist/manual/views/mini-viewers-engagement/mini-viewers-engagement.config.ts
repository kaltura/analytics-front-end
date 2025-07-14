import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniViewersEngagementConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'unique_videos': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.playlist.videosPlayed`),
            tooltip: this._translate.instant(`app.playlist.videosPlayed`),
            sortOrder: 1,
          },
          'sum_view_period': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.playlist.avgTime`),
            tooltip: this._translate.instant(`app.playlist.avgTime`),
            units: value => 'min',
            sortOrder: 2,
          }
        }
      }
    };
  }
}
