import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class InteractionsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'count_viral': {
            format: value => value,
            colors: [getPrimaryColor('entries'), getSecondaryColor('entries')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.contentInteractions.count_viral`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_download': {
            format: value => value,
            colors: [getPrimaryColor('entries'), getSecondaryColor('entries')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.contentInteractions.count_download`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_report': {
            format: value => value,
            colors: [getPrimaryColor('entries'), getSecondaryColor('entries')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.contentInteractions.count_report`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
            nonComparable: true,
          },
          'count_viral': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'count_download': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'count_report': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'status': {
            format: value => value,
            hidden: true,
          },
        }
      },
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
          'count_report': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.contentInteractions.count_report`),
            sortOrder: 3,
          },
        }
      }
    };
  }
}
