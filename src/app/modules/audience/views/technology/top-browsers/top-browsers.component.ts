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
  protected _defaultReportType = KalturaReportType.browsersFamiles;
  protected _drillDownReportType = KalturaReportType.browsers;
  public _title = 'app.audience.technology.topBrowsers';
}
