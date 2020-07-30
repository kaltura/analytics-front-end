import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class EntryTotalsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.entry.count_loads`),
            sortOrder: 1,
            icon: 'icon-small-impressions',
            iconColor: 'aqua',
          },
          'unique_viewers': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entry.viewers`),
            tooltip: this._translate.instant('app.entry.viewers_tt'),
            sortOrder: 2,
            icon: 'icon-small-viewer-contributor',
            iconColor: 'green',
          },
          'count_viral': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.entry.count_viral`),
            hidden: true,
          },
          'votes': {
            format: value => value === '-1' ? 'N/A' : ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.votes`),
            hidden: true,
          }
        }
      }
    };
  }
}
