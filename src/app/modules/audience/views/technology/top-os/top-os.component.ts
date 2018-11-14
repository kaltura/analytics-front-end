import { Component } from '@angular/core';
import { ReportService } from 'shared/services';
import { KalturaReportType } from 'kaltura-ngx-client';
import { TopOsConfig } from './top-os.config';
import { BaseDevicesReportComponent, BaseDevicesReportConfig } from '../base-devices-report/base-devices-report.component';

@Component({
  selector: 'app-top-os',
  templateUrl: '../base-devices-report/base-devices-report.component.html',
  styleUrls: ['../base-devices-report/base-devices-report.component.scss'],
  providers: [
    { provide: BaseDevicesReportConfig, useClass: TopOsConfig },
    ReportService
  ]
})
export class TopOsComponent extends BaseDevicesReportComponent {
  protected _reportType = KalturaReportType.operatingSystem;
  public _title = 'app.audience.technology.topOS';
}
