import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { fileSize } from 'shared/utils/file-size';
import {getColorPercent, getPrimaryColor, getSecondaryColor} from 'shared/utils/colors';

@Injectable()
export class StorageDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'average_storage': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${fileSize(value, 1).value} ${fileSize(value).units}</span>`,
            colors: [getPrimaryColor('default'), getColorPercent(100,'default')],
          },
          'bandwidth_consumption': {
            format: value => value,
            graphTooltip: (value) => `<span class="kValue">${fileSize(value, 1).value} ${fileSize(value).units}</span>`,
            colors: [getPrimaryColor('moderation'), getColorPercent(100, 'moderation')],
          },
          'total_entries': {
            format: value => value,
            graphTooltip: (value) => ReportHelper.numberOrZero(value),
            colors: [getPrimaryColor('entries'), getColorPercent(100,'entries')],
          },
         'unique_known_users': {
            format: value => value,
            graphTooltip: (value) => ReportHelper.numberOrZero(value),
            colors: [getPrimaryColor('viewers'), getColorPercent(100,'viewers')],
          },
         'live_view_time': {
            format: value => Math.round(ReportHelper.hours(value)),
            graphTooltip: (value) => ReportHelper.numberOrZero(value),
            colors: [getPrimaryColor('time'), getColorPercent(100,'time')],
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'year_id': {
            format: value => value,
            nonComparable: true,
          },
          'month_id': {
            format: value => DateFilterUtils.formatMonthString(value, analyticsConfig.locale),
            nonComparable: true,
          },
          'average_storage': {
            format: value => ReportHelper.numberOrZero(value, true),
            sortOrder: 1
          },
          'bandwidth_consumption': {
            format: value => ReportHelper.numberOrZero(value, true),
            sortOrder: 2
          },
          'total_entries': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4
          },
          'live_view_time': {
            format: value => ReportHelper.numberOrZero(Math.round(ReportHelper.hours(value))),
            sortOrder: 5
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'average_storage',
        fields: {
          'average_storage': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.overview.average_storage`),
            tooltip: this._translate.instant(`app.bandwidth.storedMedia_tt`),
            units: value => fileSize(value).units,
            sortOrder: 1
          },
          'bandwidth_consumption': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.overview.bandwidth_consumption`),
            units: value => fileSize(value).units,
            sortOrder: 2
          },
          'transcoding_duration': {
            format: value => ReportHelper.numberOrZero(ReportHelper.hours(value), false, 2),
            title: this._translate.instant(`app.bandwidth.overview.transcoding_duration`),
            units: value => 'Hours',
            sortOrder: 3
          },
          'transcoding_consumption': {
            format: value => ReportHelper.numberOrZero(fileSize(value).value, false),
            title: this._translate.instant(`app.bandwidth.overview.transcoding_consumption`),
            units: value => fileSize(value).units,
            sortOrder: 4
          },
          'total_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.overview.total_entries`),
            sortOrder: 5
          },
          'total_interactive_video_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.overview.total_interactive_video_entries`),
            sortOrder: 6
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.overview.unique_known_users`),
            sortOrder: 7
          },
          'live_view_time': {
            format: value => ReportHelper.numberOrZero(Math.round(ReportHelper.hours(value))),
            title: this._translate.instant(`app.bandwidth.overview.live_view_time`),
            tooltip: this._translate.instant(`app.bandwidth.live_view_tt`),
            units: value => 'Hours',
            sortOrder: 8
          },
          'video_streams': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.overview.video_streams`),
            sortOrder: 9
          },
          'total_credits': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.bandwidth.overview.total_credits`),
            sortOrder: 10
          },
        }
      }
    };
  }
}
