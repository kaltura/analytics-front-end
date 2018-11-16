import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { fileSize } from 'shared/utils/file-size';

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
          },
          'sum_time_viewed': {
            format: value => value,
          },
          'unique_known_users': {
            format: value => value,
          },
          'avg_view_drop_off': {
            format: value => value,
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'date': {
            format: value => value,
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(String(value)),
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(String(value)),
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(String(value)),
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.numberOrZero(String(value * 100)),
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.count_plays`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.count_plays_tt`),
            sortOrder: 1,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.sum_time_viewed`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.sum_time_viewed_tt`),
            units: value => 'min',
            sortOrder: 2,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.highlightsReport.unique_known_users`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.unique_known_users_tt`),
            sortOrder: 3,
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.numberOrZero(String(value * 100)),
            units: value => '%',
            title: this._translate.instant(`app.engagement.highlightsReport.avg_view_drop_off`),
            tooltip: this._translate.instant(`app.engagement.highlightsReport.avg_view_drop_off_tt`),
            sortOrder: 4,
          }
        }
      }
    };
  }
}
