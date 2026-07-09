import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class SyndicationDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        preSelected: "count_document_impression",
        fields: {
          'count_document_impression': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.count_doc_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'unique_known_users': {
            format: value => value,
            colors: [getPrimaryColor('impressions'), getSecondaryColor('impressions')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.unique_viewers`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
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
          'domain_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'referrer': {
            format: value => value,
            nonComparable: true,
            sortOrder: 2,
          },
          'count_document_impression': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: "count_document_impression",
        fields: {
          'count_document_impression': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.entry.count_doc_loads`),
            sortOrder: 1,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.entry.unique_viewers`),
            sortOrder: 2,
          },
        }
      },
    };
  }
}
