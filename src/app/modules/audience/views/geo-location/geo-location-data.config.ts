import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class GeoLocationDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            nonComparable: true,
          },
          'country': {
            format: value => value,
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'play_through_ratio': {
            format: value => ReportHelper.percents(value)
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.audience.geo.count_plays`),
            tooltip: this._translate.instant(`app.geo.count_plays_tt`),
          },
          'play_through_ratio': {
            format: value => ReportHelper.percents(value),
            title: this._translate.instant(`app.audience.geo.play_through_ratio`),
            tooltip: this._translate.instant(`app.geo.play_through_ratio_tt`),
          }
        }
      }
    };
  }
}
