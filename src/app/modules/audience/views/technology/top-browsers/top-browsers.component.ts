import { Component } from '@angular/core';
import { ReportService } from 'shared/services';
import { KalturaReportType } from 'kaltura-ngx-client';
import { TopBrowsersConfig } from './top-browsers.config';
import { BaseDevicesReportComponent, BaseDevicesReportConfig } from '../base-devices-report/base-devices-report.component';

@Component({
  selector: 'app-top-browsers',
  templateUrl: '../base-devices-report/base-devices-report.component.html',
  styleUrls: ['../base-devices-report/base-devices-report.component.scss'],
  providers: [
    { provide: BaseDevicesReportConfig, useClass: TopBrowsersConfig },
    ReportService
  ]
})
export class TopBrowsersComponent extends BaseDevicesReportComponent {
  protected _defaultReportType = KalturaReportType.browsersFamilies;
  protected _drillDownReportType = KalturaReportType.browsers;
  protected _iconType = 'browser';

  public _title = 'app.audience.technology.topBrowsers';
  
  protected get _showIcon(): boolean {
    return !this._drillDown;
  }
  
  protected getRelevantCompareRow(tableData: { [key: string]: string }[], row: { [key: string]: string }): { [key: string]: string } {
    return tableData.find(item => {
      if (this._drillDown) {
        return item.browser === row.browser;
      }
      return item.browser_family === row.browser_family;
    });
  }
}
