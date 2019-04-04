import { TranslateService } from '@ngx-translate/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';

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
      parse?: (value: any) => number;
      units?: (value: any) => string;
      title?: string;
      tooltip?: string;
      graphTooltip?: (value: any) => string;
      hidden?: boolean;
      nonComparable?: boolean;
      sortOrder?: number;
      colors?: string[];
      nonDateGraphLabel?: boolean;
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



export abstract class ReportDataBaseConfig {
  protected constructor(protected _translate: TranslateService) {
  }

  public abstract getConfig(): ReportDataConfig;
}
