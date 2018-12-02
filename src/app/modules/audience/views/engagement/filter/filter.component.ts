import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { TranslateService } from '@ngx-translate/core';
import { CategoryData } from 'shared/services/categories-search.service';
import { animate, group, state, style, transition, trigger } from '@angular/animations';

export interface OptionItem {
  value: any;
  label: string;
}

export interface FilterItem {
  value: any;
  type: string;
}

export interface FilterTagItem {
  label: string;
  value: any;
  type: string;
  tooltip: string;
}


export type RefineFilter = { value: any, type: string }[];

@Component({
  selector: 'app-refine-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({ height: '*', opacity: 0 })),
      transition(':leave', [
        style({ height: '*', opacity: 1 }),
        
        group([
          animate(300, style({ height: 0 })),
          animate('200ms ease-in-out', style({ 'opacity': '0' }))
        ])
      ]),
      transition(':enter, :leave', [
        style({ height: '0', opacity: 0 }),
        
        group([
          animate(300, style({ height: '*' })),
          animate('400ms ease-in-out', style({ 'opacity': '1' }))
        ])
      
      ])
    ])
  ]
})
export class FilterComponent {
  @Input() set opened(value: boolean) {
    const isOpened = !!value;
    
    if (this._opened !== isOpened) {
      this._opened = !!value;
  
      if (this._opened) {
        this._onPopupOpen();
      } else {
        this._onPopupClose();
      }
    }
  }
  
  @Input() set selectedFilters(value: RefineFilter) {
    this._updateSelectedValues(value);
  }
  
  @Output() filterChange = new EventEmitter<RefineFilter>();
  @Output() filterTagsChange = new EventEmitter<FilterTagItem[]>();
  @Output() closeFilters = new EventEmitter<void>();
  
  private _currentFilters: FilterItem[] = []; // local state
  private _appliedFilters: FilterItem[] = [];
  
  public _selectedValues: { [key: string]: string[]; }; // local state
  public _opened = false;
  
  constructor(private _translate: TranslateService) {
    this._clearAll();
  }
  
  public _mediaTypes: OptionItem[] = [
    { value: 'vod', label: 'app.filters.vod' },
    { value: 'live', label: 'app.filters.live' },
    { value: 'audio', label: 'app.filters.audio' },
    { value: 'interactiveVideo', label: 'app.filters.interactiveVideo' },
    { value: 'images', label: 'app.filters.images' },
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
      'categories': [],
    };
  }
  
  private _prepareFilterTags(): FilterTagItem[] {
    let label, tooltip;
    return this._appliedFilters.map(({ value, type }) => {
      switch (type) {
        case 'mediaType':
        case 'deviceType':
        case 'applications':
        case 'entrySources':
          label = this._translate.instant(`app.filters.${value}`);
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${label}`;
          return { value, type, label, tooltip };
        case 'categories':
          const category = value as CategoryData;
          label = category.name;
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${category.fullName}`;
          return { value, type, label, tooltip };
        default:
          return null;
      }
    }).filter(Boolean);
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
    // using spread to prevent passing by reference to avoid unwanted mutations
    this._appliedFilters = [...this._currentFilters];
    this._updateSelectedValues(this._currentFilters);
    this.filterChange.emit([...this._appliedFilters]);
    this.filterTagsChange.emit(this._prepareFilterTags());
  
    this.closeFilters.emit();
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
