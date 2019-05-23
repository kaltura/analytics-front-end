import { TranslateService } from '@ngx-translate/core';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';

export enum GraphType {
  line = 'line',
  bar = 'bar',
}

export enum ReportDataSection {
  table = 'table',
  totals = 'totals',
  graph = 'graph',
  accumulative = 'accumulative',
}

export interface ReportDataItemField {
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
  graphType?: GraphType;
}

export interface ReportDataFields {
  [key: string]: ReportDataItemField;
}

export interface ReportDataItemConfig {
  units?: string;
  preSelected?: string;
  fields: ReportDataFields;
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
