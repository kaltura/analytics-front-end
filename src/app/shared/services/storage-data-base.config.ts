import { TranslateService } from '@ngx-translate/core';

export interface ReportDataItemConfig {
  units?: string;
  preSelected?: string;
  fields: {
    [key: string]: {
      format: (value: any) => any;
      units?: string;
      title?: string;
      tooltip?: string;
    };
  };
}

export interface ReportDataConfig {
  table: ReportDataItemConfig;
  totals?: ReportDataItemConfig;
  graph?: any;
  accumulative?: ReportDataItemConfig;
}

export abstract class StorageDataBaseConfig {
  protected constructor(protected _translate: TranslateService) {
  }
  
  public abstract getConfig(): ReportDataConfig;
}
