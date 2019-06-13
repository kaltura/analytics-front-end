import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class TopVideosDataConfig extends ReportDataBaseConfig {
  private translate: TranslateService;
  
  constructor(_translate: TranslateService) {
    super(_translate);
    this.translate = _translate;
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {}
      },
    };
  }
}
