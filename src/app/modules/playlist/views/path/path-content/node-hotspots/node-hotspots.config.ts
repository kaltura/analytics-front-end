import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class NodeHotspotsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'hotspot_id': {
            format: value => value,
            nonComparable: true,
            hidden: true,
          },
          'hotspot_clicked': {
            format: value => value,
            sortOrder: 1,
          }
        }
      },
    };
  }
}
