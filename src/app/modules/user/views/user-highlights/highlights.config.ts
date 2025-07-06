import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import { KalturaEntryStatus } from 'kaltura-ngx-client';

@Injectable()
export class HighlightsConfig extends ReportDataBaseConfig {
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
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.count_plays`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'sum_time_viewed': {
            format: value => value,
            colors: [getPrimaryColor('time'), getSecondaryColor('time')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.sum_time_viewed`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_view_period_time': {
            format: value => parseFloat(value.toFixed(1)),
            title: this._translate.instant(`app.playlist.avg_view_period_time`),
            sortOrder: 2,
            colors: [getPrimaryColor('moderation'), getSecondaryColor('moderation')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.playlist.avg_view_period_time`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'count_loads': {
            format: value => value,
            colors: [getPrimaryColor('impressions'), getSecondaryColor('impressions')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.count_loads`)}:&nbsp;${ReportHelper.numberOrZero(String(value), false)}</span>`
          },
          'avg_completion_rate': {
            format: value => Math.min(value, 100),
            colors: [getPrimaryColor('dropoff'), getSecondaryColor('dropoff')],
            graphTooltip: (value) => `<span class="kValue">${this._translate.instant(`app.user.avg_completion_rate`)}:&nbsp;${ReportHelper.percents(value / 100, false, true)}</span>`
          },
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            hidden: true,
          },
          'entry_source': {
            format: value => value,
            hidden: true,
            nonComparable: true
          },
          'duration': {
            format: value => parseInt(value, 10),
            hidden: true,
          },
          'status': {
            format: value => value !== KalturaEntryStatus.ready
              ? value === KalturaEntryStatus.deleted
                ? this._translate.instant('app.engagement.topVideosReport.entryStatus.deleted')
                : this._translate.instant('app.engagement.topVideosReport.entryStatus.unavailable')
              : '',
            hidden: true,
          },
          'duration_msecs': {
            format: value => parseInt(value, 10),
            hidden: true,
          },
          'entry_name': {
            format: value => value,
            sortOrder: 1,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'avg_view_period_time': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            sortOrder: 6,
          },
          'total_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            sortOrder: 7,
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_loads',
        fields: {
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.count_loads`),
            sortOrder: 1,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.count_plays`),
            sortOrder: 2,
          },
          'avg_view_period_time': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.playlist.avg_view_period_time`),
            sortOrder: 3,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.sum_time_viewed`),
            sortOrder: 4,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.user.avg_completion_rate`),
            sortOrder: 5,
          }
        }
      },
      entryDetails: {
        fields: {
          'object_id': {
            format: value => value,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
          },
          'status': {
            format: value => value,
          },
          'creator_name': {
            format: value => value,
          },
          'created_at': {
            format: value => ReportHelper.format('serverDate', value),
          },
          'media_type': {
            format: value => Number(value),
          },
          'duration_msecs': {
            format: value => ReportHelper.time(value),
          }
        }
      }
    };
  }
}
