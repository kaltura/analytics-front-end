import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import {KalturaEntryStatus} from "kaltura-ngx-client";

@Injectable()
export class TopContentDataConfig extends ReportDataBaseConfig {
  private translate: TranslateService;
  constructor(_translate: TranslateService) {
    super(_translate);
    this.translate = _translate;
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            hidden: true,
          },
          'entry_name': {
            format: value => value,
            sortOrder: 1,
          },
          'status': {
            format: value => value !== KalturaEntryStatus.ready ? value === KalturaEntryStatus.deleted ? this.translate.instant('app.engagement.topVideosReport.entryStatus.deleted') : this.translate.instant('app.engagement.topVideosReport.entryStatus.unavailable') : '',
            sortOrder: 8,
          },
          'creator_name': {
            format: value => value,
            sortOrder: 2,
          },
           'created_at': {
             format: value => ReportHelper.format('serverDate', value),
            sortOrder: 3,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 4,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 5,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            sortOrder: 6,
          },
          'engagement_ranking': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 7,
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
          'entry_source': {
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
