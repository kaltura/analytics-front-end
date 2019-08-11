import { Component } from '@angular/core';
import { ReportService } from 'shared/services';
import { KalturaReportType } from 'kaltura-ngx-client';
import { TopOsConfig } from './top-os.config';
import { BaseDevicesReportComponent, BaseDevicesReportConfig } from '../base-devices-report/base-devices-report.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-top-os',
  templateUrl: '../base-devices-report/base-devices-report.component.html',
  styleUrls: ['../base-devices-report/base-devices-report.component.scss'],
  providers: [
    KalturaLogger.createLogger('TopOsComponent'),
    { provide: BaseDevicesReportConfig, useClass: TopOsConfig },
    ReportService
  ]
})
export class TopOsComponent extends BaseDevicesReportComponent {
  protected _defaultReportType = reportTypeMap(KalturaReportType.operatingSystemFamilies);
  protected _drillDownReportType = reportTypeMap(KalturaReportType.operatingSystem);
  public _name = 'top-os';
  
  public _title = 'app.audience.technology.topOS';
  
  protected _iconType = 'os';
  
  protected get showIcon(): boolean {
    return false;
  }
  
  protected getRelevantCompareRow(tableData: { [key: string]: string }[], row: { [key: string]: string }): { [key: string]: string } {
    return tableData.find(item => {
      if (this._drillDown) {
        return item.os === row.os;
      }
      return item.os_family === row.os_family;
    });
  }
}
