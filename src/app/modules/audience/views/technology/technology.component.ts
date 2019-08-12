import { Component, OnInit, ViewChild } from '@angular/core';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { DevicesOverviewComponent } from './devices-overview/devices-overview.component';
import { KalturaReportType } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TechnologyExportConfig } from './technology-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { EngagementExportConfig } from '../engagement/engagement-export.config';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-technology',
  templateUrl: './technology.component.html',
  styleUrls: ['./technology.component.scss'],
  providers: [
    TechnologyExportConfig,
    KalturaLogger.createLogger('TechnologyComponent')
  ]
})
export class TechnologyComponent implements OnInit {
  @ViewChild('overview') _overview: DevicesOverviewComponent;

  public _selectedMetric: string;
  public _dateRange = DateRanges.Last30D;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = false;
  public _allowedDevices = ['Computer', 'Mobile', 'Tablet', 'Game console', 'Digital media receiver'];
  public _filterEvent: DateChangeEvent = null;
  public _devicesFilter: string[] = [];
  public _devicesList: { value: string, label: string; }[] = [];
  public _reportType = reportTypeMap(KalturaReportType.platforms);
  public _exportConfig: ExportItem[] = [];
  
  constructor(private _exportConfigService: TechnologyExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }
  
  ngOnInit() {
  }
  
  public _onDateFilterChange(event: DateChangeEvent): void {
    this._filterEvent = event;
  }
  
  public _onDeviceFilterChange(event: string[]): void {
    this._devicesFilter = event;
  }
  
  public _onDevicesListChange(event: { value: string, label: string; }[]): void {
    this._devicesList = event;
  }
  
  public _onReportDeviceFilterChange(): void {
    if (this._overview) {
      this._overview.resetDeviceFilters();
    }
  }
  
  public _onDrillDown(event: { drillDown: string, reportType: KalturaReportType, name: string }): void {
    const { drillDown, reportType, name } = event;
    let update: Partial<ExportItem> = { reportType: reportType };

    if (reportType === reportTypeMap(KalturaReportType.browsers)) {
      update.additionalFilters = { browserFamilyIn: drillDown };
    } else if (reportType === reportTypeMap(KalturaReportType.operatingSystem)) {
      update.additionalFilters = { operatingSystemFamilyIn: drillDown };
    }
    this._exportConfig = EngagementExportConfig.updateConfig(this._exportConfigService.getConfig(), name, update);
  }
}
