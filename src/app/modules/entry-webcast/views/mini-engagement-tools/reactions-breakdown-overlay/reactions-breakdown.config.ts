import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class ReactionsBreakdownConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'reaction': {
            format: value => value,
            nonComparable: true,
            sortOrder: 1,
          },
          'count_reaction_clicked': {
            format: value => value,
            nonComparable: true,
            sortOrder: 2,
          }
        }
      }
    };
  }
}
