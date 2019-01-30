import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import * as moment from 'moment';

@Injectable()
export class TopVideosDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
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
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 4,
          },
        }
      }
    };
  }
}
