import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniLiveEngagementConfig extends ReportDataBaseConfig {
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
            sortOrder: 1,
          },
          'unique_viewers': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryWebcast.highlights.knownUsers`),
            sortOrder: 2,
          },
          'sum_view_period': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.sum_time_viewed`),
            units: value => 'min',
            sortOrder: 3,
          },
          'sum_live_view_period': {
            format: value => ReportHelper.integerOrZero(value),
            sortOrder: 4,
          }
        }
      }
    };
  }
}
