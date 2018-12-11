import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { fileSize } from 'shared/utils/file-size';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class EndUserStorageDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'total_storage_mb': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
          },
          'total_entries': {
            format: value => value,
            colors: [getPrimaryColor('entries'), getSecondaryColor('entries')],
          },
          'total_msecs': {
            format: value => Math.round(value / 60000),
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;Min`,
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'name': {
            format: value => value,
            nonComparable: true,
          },
          'date_id': {
            format: value => DateFilterUtils.formatFullDateString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'month_id': {
            format: value => DateFilterUtils.formatMonthString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5
          },
          'deleted_entries': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 6
          },
          'total_entries': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4
          },
          'added_storage_mb': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2
          },
          'deleted_storage_mb': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3
          },
          'total_storage_mb': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1
          },
          'added_msecs': {
            format: value => ReportHelper.numberOrZero(value / 60000, false),
            sortOrder: 8
          },
          'deleted_msecs': {
            format: value => ReportHelper.numberOrZero(value / 60000, false),
            sortOrder: 9
          },
          'total_msecs': {
            format: value => ReportHelper.numberOrZero(value / 60000, false),
            sortOrder: 7,
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'total_storage_mb',
        fields: {
          'total_storage_mb': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.total_storage_mb`),
            tooltip: this._translate.instant(`app.bandwidth.total_storage_mb_tt`),
            units: value => fileSize(value).units,
            sortOrder: 1
          },
          'total_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.total_entries`),
            tooltip: this._translate.instant(`app.bandwidth.total_entries_tt`),
            sortOrder: 2,
          },
          'total_msecs': {
            format: value => ReportHelper.numberOrZero(Math.round(value / 60000)),
            title: this._translate.instant(`app.bandwidth.total_msecs`),
            tooltip: this._translate.instant(`app.bandwidth.total_msecs_tt`),
            units: value => 'Min',
            sortOrder: 3,
          },
        }
      }
    };
  }
}
