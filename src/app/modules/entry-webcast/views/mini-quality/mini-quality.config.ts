import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniQualityConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'avg_live_buffer_time': {
            format: value => ReportHelper.percents(value, false, true),
            title: this._translate.instant(`app.entryWebcast.quality.buffer`),
            sortOrder: 1,
          },
          'avg_bitrate': {
            format: value => `${ReportHelper.numberOrZero(value)} Kbps`,
            title: this._translate.instant(`app.entryWebcast.quality.bitrate`),
            sortOrder: 2,
          }
        }
      }
    };
  }
}
