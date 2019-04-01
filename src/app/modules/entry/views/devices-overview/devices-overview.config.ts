import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Injectable()
export class DevicesOverviewConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'device': {
            format: value => value,
          },
          'count_plays': {
            format: value => value,
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => value,
            title: this._translate.instant(`app.audience.technology.count_plays`),
            sortOrder: 1,
            colors: [getPrimaryColor(), getSecondaryColor()],
          }
        }
      }
    };
  }
}
