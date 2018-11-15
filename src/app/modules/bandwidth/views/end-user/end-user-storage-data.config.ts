import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { fileSize } from 'shared/utils/file-size';

@Injectable()
export class EndUserStorageDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'added_storage_mb': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
          },
          'deleted_storage_mb': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
          },
          'added_entries': {
            format: value => value
          },
          'deleted_entries': {
            format: value => value
          },
          'added_msecs': {
            format: value => Math.round(value / 60000)
          },
          'deleted_msecs': {
            format: value => Math.round(value / 60000)
          },
          'total_storage_mb': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;MB`,
          },
          'total_entries': {
            format: value => value,
          },
          'total_msecs': {
            format: value => Math.round(value / 60000)
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
            format: value => ReportHelper.numberOrZero(value)
          },
          'deleted_entries': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'total_entries': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'added_storage_mb': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'deleted_storage_mb': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'total_storage_mb': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'added_msecs': {
            format: value => ReportHelper.time(value)
          },
          'deleted_msecs': {
            format: value => ReportHelper.time(value)
          },
          'total_msecs': {
            format: value => ReportHelper.time(value)
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'added_entries',
        fields: {
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.added_entries`),
            tooltip: this._translate.instant(`app.bandwidth.added_entries_tt`),
          },
          'deleted_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.deleted_entries`),
            tooltip: this._translate.instant(`app.bandwidth.deleted_entries_tt`),
          },
          'total_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.total_entries`),
            tooltip: this._translate.instant(`app.bandwidth.total_entries_tt`),
          },
          'added_storage_mb': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.added_storage_mb`),
            tooltip: this._translate.instant(`app.bandwidth.added_storage_mb_tt`),
            units: value => fileSize(value).units,
          },
          'deleted_storage_mb': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.deleted_storage_mb`),
            tooltip: this._translate.instant(`app.bandwidth.deleted_storage_mb_tt`),
            units: value => fileSize(value).units,
          },
          'total_storage_mb': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.total_storage_mb`),
            tooltip: this._translate.instant(`app.bandwidth.total_storage_mb_tt`),
            units: value => fileSize(value).units,
          },
          'added_msecs': {
            format: value => ReportHelper.time(value),
            title: this._translate.instant(`app.bandwidth.added_msecs`),
            tooltip: this._translate.instant(`app.bandwidth.added_msecs_tt`),
          },
          'deleted_msecs': {
            format: value => ReportHelper.time(value),
            title: this._translate.instant(`app.bandwidth.deleted_msecs`),
            tooltip: this._translate.instant(`app.bandwidth.deleted_msecs_tt`),
          },
          'total_msecs': {
            format: value => ReportHelper.time(value),
            title: this._translate.instant(`app.bandwidth.total_msecs`),
            tooltip: this._translate.instant(`app.bandwidth.total_msecs_tt`),
          },
        }
      }
    };
  }
}
