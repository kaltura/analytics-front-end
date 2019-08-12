import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { KalturaEntryStatus } from 'kaltura-ngx-client';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';

@Injectable()
export class UserMediaUploadConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        preSelected: 'added_entries',
        fields: {
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.user.added_entries`),
            sortOrder: 1,
          },
          'added_msecs': {
            format: value => ReportHelper.numberOrZero(ReportHelper.minutes(value)),
            title: this._translate.instant(`app.user.added_msecs`),
            units: value => 'min',
            sortOrder: 2,
          }
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'added_entries': {
            format: value => value,
            colors: ['entries'],
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>`,
            nonDateGraphLabel: true,
          },
          'added_msecs': {
            format: value => value,
            colors: ['time'],
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;Min`,
            nonDateGraphLabel: true,
          }
        }
      },
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            hidden: true,
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
          'created_at': {
            format: value => DateFilterUtils.formatFullDateString(Number(value)),
            sortOrder: 2,
          },
          'count_loads': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 6,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false),
            sortOrder: 7,
          },
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
      },
    };
  }
}
