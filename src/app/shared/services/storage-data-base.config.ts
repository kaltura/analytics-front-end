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
      units?: (value: any) => string;
      title?: string;
      tooltip?: string;
      hidden?: boolean;
      nonComparable?: boolean;
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

  public prepareCsvExportHeaders(tabsData: Tab[], columns: string[], translationPrefix: string): string {
    const config = this.getConfig();
    let headers = '';

    tabsData.forEach( (tab: Tab) => {
      headers = `${headers}${tab.title},`;
    });
    headers = headers.substr(0, headers.length - 1) + ';';

    columns.forEach( col => {
      headers = `${headers}${this._translate.instant(`${translationPrefix}.${col}`)},`;
    });

    return headers.substr(0, headers.length - 1);
  }
}
