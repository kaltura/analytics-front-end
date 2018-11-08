import { Component, OnInit } from '@angular/core';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';

@Component({
  selector: 'app-technology',
  templateUrl: './technology.component.html',
  styleUrls: ['./technology.component.scss'],
})
export class TechnologyComponent implements OnInit {
  public _dateRange = DateRanges.CurrentYear;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = false;
  public _allowedDevices = ['COMPUTER', 'MOBILE', 'TABLET'];
  public _filterEvent: DateChangeEvent = null;
  public _devicesFilter: string[] = null;
  public _devicesList: { value: string, label: string; }[] = [];
  
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
}
