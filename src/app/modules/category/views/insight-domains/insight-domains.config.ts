import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class InsightDomainsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
          },
          'domain_name': {
            format: value => value,
          },
          'referrer': {
            format: value => value,
          },
          'count_plays': {
            format: value => value,
          },
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'count_plays': {
            format: value => value,
          },
        }
      }
    };
  }
}
