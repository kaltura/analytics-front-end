import { Component, OnInit, ViewChild } from '@angular/core';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { DevicesOverviewComponent } from './devices-overview/devices-overview.component';
import { KalturaEndUserReportInputFilter, KalturaReportType } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Component({
  selector: 'app-technology',
  templateUrl: './technology.component.html',
  styleUrls: ['./technology.component.scss'],
  providers: [KalturaLogger.createLogger('TechnologyComponent')]
})
export class TechnologyComponent implements OnInit {
  @ViewChild('overview') _overview: DevicesOverviewComponent;

  public _selectedMetric: string;
  public _dateRange = DateRanges.Last30D;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = false;
  public _allowedDevices = ['Computer', 'Mobile', 'Tablet', 'Game console'];
  public _filterEvent: DateChangeEvent = null;
  public _devicesFilter: string[] = [];
  public _devicesList: { value: string, label: string; }[] = [];
  public _exportData: { headers: string, totalCount: number, filter: KalturaEndUserReportInputFilter, selectedMetrics: string; } = null;
  public _reportType = KalturaReportType.platforms;
  
  constructor() {
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
  
  public _onExportDataChange(event: { headers: string, totalCount: number, filter: KalturaEndUserReportInputFilter, selectedMetrics: string }): void {
    this._exportData = event;
  }
}
