import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';

export interface OptionItem {
  value: any;
  label: string;
}

export interface FilterItem {
  value: any;
  type: string;
}

export type RefineFilter = { value: any, type: string }[];

@Component({
  selector: 'app-refine-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent {
  @Input() set selectedFilters(value: RefineFilter) {
    this._updateSelectedValues(value);
  }
  
  @Output() filterChange = new EventEmitter<RefineFilter>();
  
  @ViewChild('refineFilters') _refineFiltersPopup: PopupWidgetComponent;
  
  private _currentFilters: FilterItem[] = [];
  private _appliedFilters: FilterItem[] = [];
  
  public _selectedValues: { [key: string]: string[]; };
  
  constructor() {
    this._clearAll();
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
  
  private _clearSelectedValues(): void {
    this._selectedValues = {
      'mediaType': [],
      'deviceType': [],
      'applications': [],
      'entrySources': [],
    };
  }
  
  private _clearAll(): void {
    this._clearSelectedValues();
    this._currentFilters = [];
    this._appliedFilters = [];
  }
  
  private _updateSelectedValues(values: FilterItem[]): void {
    if (Array.isArray(values) && values.length) {
      values.forEach(item => {
        if (!this._selectedValues[item.type]) {
          this._selectedValues[item.type] = [item.value];
        } else {
          this._selectedValues[item.type].push(item.value);
        }
      });
    } else {
      this._clearSelectedValues();
    }
  }
  
  public _onItemSelected(item: any, type: string): void {
    this._currentFilters.push({ value: item, type });
  }
  
  public _onItemUnselected(item: any, type: string): void {
    const unselectedItemIndex = this._currentFilters.findIndex(filterItem => filterItem.value === item && filterItem.type === type);
    
    if (unselectedItemIndex !== -1) {
      this._currentFilters.splice(unselectedItemIndex, 1);
    }
  }
  
  public _onPopupOpen(): void {
    this._currentFilters = [...this._appliedFilters];
    this._updateSelectedValues(this._currentFilters);
  }
  
  public _onPopupClose(): void {
    this._currentFilters = [];
    this._updateSelectedValues(this._currentFilters);
  }
  
  public _apply(): void {
    this._appliedFilters = [...this._currentFilters];
    this._updateSelectedValues(this._currentFilters);
    this.filterChange.emit([...this._appliedFilters]);
    
    if (this._refineFiltersPopup) {
      this._refineFiltersPopup.close();
    }
  }
  
  public removeFilter(item: { value: string, label: string, type: string }): void {
    this._onItemUnselected(item.value, item.type);
    this._apply();
  }
  
  public removeAll(): void {
    this._clearAll();
    this._currentFilters = [];
    this._apply();
  }
}
