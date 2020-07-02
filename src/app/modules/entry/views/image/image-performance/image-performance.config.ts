import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getColorPalette, getPrimaryColor, getSecondaryColor} from 'shared/utils/colors';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';

@Injectable()
export class ImagePerformanceConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'month_id': {
            format: value => DateFilterUtils.formatMonthString(value, analyticsConfig.locale),
            nonComparable: true,
            sortOrder: 1,
          },
          'date_id': {
            format: value => DateFilterUtils.formatFullDateString(value),
            nonComparable: true,
            sortOrder: 1,
          },
          'full_name': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'name': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_loads`),
            sortOrder: 1,
            colors: [getPrimaryColor('impressions'), getSecondaryColor('impressions')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'unique_known_users': {
            format: value => value,
            title: this._translate.instant(`app.entry.unique_known_users`),
            sortOrder: 2,
            colors: [getPrimaryColor('viewers'), getSecondaryColor('viewers')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.entry.unique_known_users`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_loads',
        fields: {
          'count_loads': {
            format: value => value,
            title: this._translate.instant(`app.entry.count_loads`),
            sortOrder: 1,
          },
          'unique_known_users': {
            format: value => value,
            title: this._translate.instant(`app.entry.unique_known_users`),
            tooltip: this._translate.instant('app.entry.unique_known_users_tt'),
            sortOrder: 2,
          },
        }
      }
    };
  }
}
