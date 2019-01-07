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
          'contributors': {
            format: value => value,
            title: this._translate.instant(`app.contributors.title`),
            tooltip: this._translate.instant(`app.contributors.contributors_tt`),
            sortOrder: 1,
          },
          'added_entries': {
            format: value => value,
            title: this._translate.instant(`app.contributors.added_entries`),
            tooltip: this._translate.instant(`app.contributors.added_entries_tt`),
            sortOrder: 2,
          },
          'added_msecs': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.contributors.added_msecs`),
            tooltip: this._translate.instant(`app.contributors.added_msecs_tt`),
            sortOrder: 3,
          }
        }
      }
    };
  }
}
