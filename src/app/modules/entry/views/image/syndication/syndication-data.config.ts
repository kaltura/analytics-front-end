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
        fields: {
          'count_plays': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.topDomainsReport.count_plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_loads': {
            format: value => value,
            colors: [getPrimaryColor('impressions'), getSecondaryColor('impressions')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.engagement.topDomainsReport.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
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
            sortOrder: 1,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_loads',
        fields: {
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.count_loads`),
            sortOrder: 1,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.engagement.topDomainsReport.count_plays`),
            sortOrder: 2,
          },
        }
      },
    };
  }
}
