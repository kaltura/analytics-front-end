import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniViewersConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'unique_vod_live_viewers': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryEp.highlights.viewers`),
            sortOrder: 1,
          },
          'unique_combined_live_viewers': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryEp.highlights.live`),
            sortOrder: 2,
          },
          'unique_vod_viewers': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryEp.highlights.recordings`),
            sortOrder: 3,
          }
        }
      }
    };
  }
}
