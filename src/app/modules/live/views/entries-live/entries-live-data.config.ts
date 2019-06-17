import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class EntriesLiveDataConfig extends ReportDataBaseConfig {
  private translate: TranslateService;
  
  constructor(_translate: TranslateService) {
    super(_translate);
    this.translate = _translate;
  }
  
  public getConfig(): ReportDataConfig {
    return {
      // entry_id|view_unique_audience|avg_view_engagement|avg_view_buffering|avg_view_downstream_bandwidth
      [ReportDataSection.table]: {
        fields: {
          'entry_id': {
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
          'view_unique_audience': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 3,
          },
          'avg_view_engagement': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 4,
          },
          'avg_view_buffering': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 5,
          },
          'avg_view_downstream_bandwidth': {
            format: value => `${ReportHelper.numberOrZero(value)} KBps`,
            sortOrder: 6,
          },
        }
      },
    };
  }
}
