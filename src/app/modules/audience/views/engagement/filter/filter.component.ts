import { Component, EventEmitter, Output } from '@angular/core';

export interface RefineChangeEvent {
  mediaTypes: string[];
  deviceTypes: string[];
}

@Component({
  selector: 'app-refine-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent {
  @Output() filterChange = new EventEmitter<RefineChangeEvent>();
  
  public _selectedMediaTypes: string[] = [];
  public _mediaTypes: { value: string, label: string; }[] = [
    { value: 'vod', label: 'app.filters.vod' },
    { value: 'live', label: 'app.filters.live' },
    { value: 'audio', label: 'app.filters.audio' },
    { value: 'interactiveVideo', label: 'app.filters.interactiveVideo' },
  ];
  
  public _selectedDeviceTypes: string[] = [];
  public _deviceTypes: { value: string, label: string; }[] = [
    { value: 'mobile', label: 'app.filters.mobile' },
    { value: 'tablet', label: 'app.filters.tablet' },
    { value: 'desktop', label: 'app.filters.desktop' },
    { value: 'other', label: 'app.filters.other' },
  ];
  
  public _onTypesSelectionChange(): void {
    this.filterChange.emit({
      mediaTypes: this._selectedMediaTypes,
      deviceTypes: this._selectedDeviceTypes,
    });
  }
}
