import { TranslateService } from '@ngx-translate/core';

export enum ReportDataSection {
  table = 'table',
  totals = 'totals',
  graph = 'graph',
  accumulative = 'accumulative',
}

export interface ReportDataItemConfig {
  units?: string;
  preSelected?: string;
  fields: {
    [key: string]: {
      format: (value: any) => any;
      units?: string;
      title?: string;
      tooltip?: string;
      hidden?: boolean;
    };
  };
}

// can have either one of predefined sections or any string keys for a custom handling for specific cases
export interface ReportDataConfig {
  [ReportDataSection.table]?: ReportDataItemConfig;
  [ReportDataSection.totals]?: ReportDataItemConfig;
  [ReportDataSection.graph]?: ReportDataItemConfig;
  [key: string]: ReportDataItemConfig;
}



export abstract class StorageDataBaseConfig {
  protected constructor(protected _translate: TranslateService) {
  }
  
  public abstract getConfig(): ReportDataConfig;
}
