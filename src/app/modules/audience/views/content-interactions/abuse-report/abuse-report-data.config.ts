import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig } from 'shared/services/storage-data-base.config';
import { EChartOption } from 'echarts';

@Injectable()
export class AbuseReportDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {};
  }
}
