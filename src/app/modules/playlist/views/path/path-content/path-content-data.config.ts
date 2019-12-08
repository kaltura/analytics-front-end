import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import {KalturaEntryStatus} from "kaltura-ngx-client";

@Injectable()
export class PathContentDataConfig extends ReportDataBaseConfig {
  private translate: TranslateService;
  constructor(_translate: TranslateService) {
    super(_translate);
    this.translate = _translate;
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'node_id': {
            format: value => value,
            hidden: true,
          },
          'count_node_plays': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 1,
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            sortOrder: 3,
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
