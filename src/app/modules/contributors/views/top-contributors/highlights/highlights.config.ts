import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class HighlightsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'added_entries': {
            format: value => value,
            colors: [getPrimaryColor('entries'), getSecondaryColor('entries')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.contributors.added_entries`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'added_msecs': {
            format: value => value,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.contributors.added_msecs`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'contributors': {
            format: value => value,
            colors: [getPrimaryColor('viewers'), getSecondaryColor('viewers')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.contributors.contributors`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'added_entries',
        fields: {
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.contributors.added_entries`),
            tooltip: this._translate.instant(`app.contributors.added_entries_tt`),
            sortOrder: 1,
          },
          'added_msecs': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.contributors.added_msecs`),
            tooltip: this._translate.instant(`app.contributors.added_msecs_tt`),
            units: value => 'min',
            sortOrder: 2,
          },
          'contributors': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.contributors.contributors`),
            tooltip: this._translate.instant(`app.contributors.contributors_tt`),
            sortOrder: 3,
          }
        }
      }
    };
  }
}
