import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniEngagementToolsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'count_reaction_clicked': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryWebcast.tools.reactions`),
            sortOrder: 1,
          },
          'count_add_to_calendar_clicked': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entryWebcast.tools.added`),
            sortOrder: 2,
          }
        }
      }
    };
  }
}
