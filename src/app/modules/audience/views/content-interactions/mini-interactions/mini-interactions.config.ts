import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniInteractionsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        preSelected: 'count_viral',
        fields: {
          'count_viral': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.contentInteractions.count_viral`),
            sortOrder: 1,
          },
          'count_download': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.contentInteractions.count_download`),
            sortOrder: 2,
          },
          'count_captions': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.contentInteractions.count_captions`),
            sortOrder: 3,
          },
          'count_report': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.contentInteractions.count_report`),
            sortOrder: 4,
          },
        }
      }
    };
  }
}
