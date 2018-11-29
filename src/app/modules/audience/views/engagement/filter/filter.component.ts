import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface OptionItem {
  value: any;
  label: string;
}

export type RefineFilter = { value: any, type: string }[];

@Component({
  selector: 'app-refine-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent {
  @Input() set selectedFilters(value: RefineFilter) {
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (!this._selectedValues[item.type]) {
          this._selectedValues[item.type] = [item.value];
        } else {
          this._selectedValues[item.type].push(item.value);
        }
      });
    }
  }
  
  @Output() filterChange = new EventEmitter<RefineFilter>();
  
  private _currentFilters: any[] = [];
  
  public _selectedValues: { [key: string]: string[]; };
  
  constructor() {
    this._resetSelectedValues();
  }
  
  public _mediaTypes: OptionItem[] = [
    { value: 'vod', label: 'app.filters.vod' },
    { value: 'live', label: 'app.filters.live' },
    { value: 'audio', label: 'app.filters.audio' },
    { value: 'interactiveVideo', label: 'app.filters.interactiveVideo' },
  ];
  
  public _deviceTypes: OptionItem[] = [
    { value: 'mobile', label: 'app.filters.mobile' },
    { value: 'tablet', label: 'app.filters.tablet' },
    { value: 'desktop', label: 'app.filters.desktop' },
    { value: 'other', label: 'app.filters.other' },
  ];
  
  public _applications: OptionItem[] = [
    { value: 'mediaSpace', label: 'app.filters.mediaSpace' },
    { value: 'mediaSpaceGo', label: 'app.filters.mediaSpaceGo' },
    { value: 'pitch', label: 'app.filters.pitch' },
    { value: 'others', label: 'app.filters.others' },
  ];
  
  public _entrySources: OptionItem[] = [
    { value: 'upload', label: 'app.filters.upload' },
    { value: 'webcasting', label: 'app.filters.webcasting' },
    { value: 'capture', label: 'app.filters.capture' },
    { value: 'classroom', label: 'app.filters.classroom' },
  ];
  
  private _resetSelectedValues(): void {
    this._selectedValues = {
      'mediaType': [],
      'deviceType': [],
      'applications': [],
      'entrySources': [],
    };
  }
  
  public _onItemSelected(item: any, type: string): void {
    this._currentFilters.push({ value: item, type });
    this._selectedValues[type].push(item);
    this.filterChange.emit(this._currentFilters);
  }
  
  public _onItemUnselected(item: any, type: string): void {
    const unselectedItemIndex = this._currentFilters.findIndex(filterItem => filterItem.value === item && filterItem.type === type);
    const unselectedValueIndex = this._selectedValues[type].indexOf(item);
    
    if (unselectedItemIndex !== -1) {
      this._currentFilters.splice(unselectedItemIndex, 1);
    }
    
    if (unselectedValueIndex !== -1) {
      this._selectedValues[type].splice(unselectedValueIndex, 1);
    }
  
    this.filterChange.emit(this._currentFilters);
  }
  
  public removeFilter(item: { value: string, label: string, type: string }): void {
    this._onItemUnselected(item.value, item.type);
  }
  
  public removeAll(): void {
    this._resetSelectedValues();
    this._currentFilters = [];
    this.filterChange.emit(this._currentFilters);
  }
}
