import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { fileSize } from 'shared/utils/file-size';

@Injectable()
export class PublisherStorageDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'month_id': {
            format: value => value
          },
          'date_id': {
            format: value => value
          },
          'bandwidth_consumption': {
            format: value => value
          },
          'average_storage': {
            format: value => value
          },
          'peak_storage': {
            format: value => value
          },
          'added_storage': {
            format: value => value
          },
          'deleted_storage': {
            format: value => value
          },
          'combined_bandwidth_storage': {
            format: value => value
          },
          'transcoding_consumption': {
            format: value => value
          }
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'month_id': {
            format: value => DateFilterUtils.formatMonthString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'date_id': {
            format: value => DateFilterUtils.formatFullDateString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'bandwidth_consumption': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'average_storage': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'peak_storage': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'added_storage': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'deleted_storage': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'combined_bandwidth_storage': {
            format: value => ReportHelper.numberOrZero(value)
          },
          'transcoding_consumption': {
            format: value => ReportHelper.numberOrZero(value)
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'bandwidth_consumption',
        fields: {
          'bandwidth_consumption': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.bandwidth_consumption`),
            tooltip: this._translate.instant(`app.bandwidth.bandwidth_consumption_tt`),
            units: value => fileSize(value).units,
          },
          'average_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.average_storage`),
            tooltip: this._translate.instant(`app.bandwidth.average_storage_tt`),
            units: value => fileSize(value).units,
          },
          'peak_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.peak_storage`),
            tooltip: this._translate.instant(`app.bandwidth.peak_storage_tt`),
            units: value => fileSize(value).units,
          },
          'added_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.added_storage`),
            tooltip: this._translate.instant(`app.bandwidth.added_storage_tt`),
            units: value => fileSize(value).units,
          },
          'deleted_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.deleted_storage`),
            tooltip: this._translate.instant(`app.bandwidth.deleted_storage_tt`),
            units: value => fileSize(value).units,
          },
          'combined_bandwidth_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.combined_bandwidth_storage`),
            tooltip: this._translate.instant(`app.bandwidth.combined_bandwidth_storage_tt`),
            units: value => fileSize(value).units,
          },
          'transcoding_consumption': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.transcoding_consumption`),
            tooltip: this._translate.instant(`app.bandwidth.transcoding_consumption_tt`),
            units: value => fileSize(value).units,
          },
        }
      },
      accumulative: {
        fields: {
          'aggregated_monthly_avg_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant('app.bandwidth.aggregated_monthly_avg_storage'),
            units: value => fileSize(value).units,
          },
          'combined_bandwidth_aggregated_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant('app.bandwidth.combined_bandwidth_aggregated_storage'),
            units: value => fileSize(value).units,
          }
        }
      }
    };
  }
}
