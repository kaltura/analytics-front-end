import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, StorageDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class PublisherStorageDataConfig extends StorageDataBaseConfig {
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
            format: value => ReportHelper.numberOrNA(value)
          },
          'average_storage': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'peak_storage': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'added_storage': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'deleted_storage': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'combined_bandwidth_storage': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'transcoding_consumption': {
            format: value => ReportHelper.numberOrNA(value)
          }
        }
      },
      [ReportDataSection.totals]: {
        units: 'MB',
        preSelected: 'bandwidth_consumption',
        fields: {
          'bandwidth_consumption': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.bandwidth.bandwidth_consumption`),
            tooltip: this._translate.instant(`app.bandwidth.bandwidth_consumption_tt`),
          },
          'average_storage': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.bandwidth.average_storage`),
            tooltip: this._translate.instant(`app.bandwidth.average_storage_tt`),
          },
          'peak_storage': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.bandwidth.peak_storage`),
            tooltip: this._translate.instant(`app.bandwidth.peak_storage_tt`),
          },
          'added_storage': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.bandwidth.added_storage`),
            tooltip: this._translate.instant(`app.bandwidth.added_storage_tt`),
          },
          'deleted_storage': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.bandwidth.deleted_storage`),
            tooltip: this._translate.instant(`app.bandwidth.deleted_storage_tt`),
          },
          'combined_bandwidth_storage': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.bandwidth.combined_bandwidth_storage`),
            tooltip: this._translate.instant(`app.bandwidth.combined_bandwidth_storage_tt`),
          },
          'transcoding_consumption': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.bandwidth.transcoding_consumption`),
            tooltip: this._translate.instant(`app.bandwidth.transcoding_consumption_tt`),
          },
        }
      },
      accumulative: {
        fields: {
          'aggregated_monthly_avg_storage': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant('app.bandwidth.aggregated_monthly_avg_storage'),
            units: 'MB',
          },
          'combined_bandwidth_aggregated_storage': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant('app.bandwidth.combined_bandwidth_aggregated_storage'),
            units: 'MB',
          }
        }
      }
    };
  }
}
