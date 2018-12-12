import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CategoryData } from 'shared/services/categories-search.service';
import { animate, AnimationEvent, group, state, style, transition, trigger } from '@angular/animations';
import { KalturaMediaType, KalturaSourceType, KalturaUser } from 'kaltura-ngx-client';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterService } from './location-filter/locations-filter.service';
import { LocationsFilterValue } from './location-filter/location-filter.component';

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
  providers: [LocationsFilterService],
  animations: [
    trigger('state', [
      state('visible', style({ height: '*', opacity: 1 })),
      state('hidden', style({ height: '0', opacity: 0 })),
      transition('* => visible', [
        style({ height: '0', opacity: 0 }),
        group([
          animate(300, style({ height: '*' })),
          animate('400ms ease-in-out', style({ 'opacity': '1' }))
        ])
      ]),
      transition('visible => hidden', [
        style({ height: '*', opacity: 1 }),
        group([
          animate(300, style({ height: 0 })),
          animate('200ms ease-in-out', style({ 'opacity': '0' }))
        ])
      ])
    ])
  ]
})
export class FilterComponent {
  @Input() set opened(value: boolean) {
    const isOpened = !!value;
    
    if (this.showFilters !== isOpened) {
      this.showFilters = !!value;
      
      if (this.showFilters) {
        this._onPopupOpen();
      } else {
        this._onPopupClose();
      }
    }
  }
  
  @Input() set selectedFilters(value: RefineFilter) {
    this._updateSelectedValues(value);
  }
  
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value !== undefined) {
      this._dateFilter = value;
  
      setTimeout(() => { // remove location filter in the next tick to avoid tags array update collisions
        if (this._currentFilters.find(({ type }) => type === 'location')) {
          this._removeFilter({ type: 'location', value: null, label: null });
        }
      });
    }
  }
  @Output() filterChange = new EventEmitter<RefineFilter>();
  @Output() closeFilters = new EventEmitter<void>();
  
  private _currentFilters: FilterItem[] = []; // local state
  private _appliedFilters: FilterItem[] = [];
  private _showFilters: boolean;
  private _firstTimeLoading = true;
  
  public _dateFilter: DateChangeEvent;
  public _selectedValues: { [key: string]: string[]; }; // local state
  public _state: string;
  public _advancedFiltersState: string;
  public _showAdvancedFilters: boolean;
  public _tags: FilterTagItem[] = [];
  
  get showFilters() {
    return this._showFilters;
  }
  
  set showFilters(val: boolean) {
    if (val) {
      this._state = 'visible';
      this._showFilters = true;
    } else {
      this._state = 'hidden';
    }
  }
  
  get showAdvancedFilters() {
    return this._showAdvancedFilters;
  }
  
  set showAdvancedFilters(val: boolean) {
    if (val) {
      this._advancedFiltersState = 'visible';
      this._showAdvancedFilters = true;
    } else {
      this._advancedFiltersState = 'hidden';
    }
  }
  
  constructor(private _translate: TranslateService) {
    this._clearAll();
  }
  
  public _mediaTypes: OptionItem[] = [
    { value: KalturaMediaType.video, label: 'app.filters.mediaType.1' },
    { value: KalturaMediaType.liveStreamFlash, label: 'app.filters.mediaType.201' },
    { value: KalturaMediaType.audio, label: 'app.filters.mediaType.5' },
    // { value: 'interactiveVideo', label: 'app.filters.interactiveVideo' }, // TODO what is interactive video?
    { value: KalturaMediaType.image, label: 'app.filters.mediaType.2' },
  ];
  
  public _applications: OptionItem[] = [
    { value: 'mediaSpace', label: 'app.filters.applications.mediaSpace' },
    { value: 'mediaSpaceGo', label: 'app.filters.applications.mediaSpaceGo' },
    { value: 'pitch', label: 'app.filters.applications.pitch' },
    { value: 'others', label: 'app.filters.applications.others' },
  ];

  public _entrySources: OptionItem[] = [ // TODO determine valid values
    { value: 1, label: 'app.filters.entrySources.1' },
    { value: 2, label: 'app.filters.entrySources.2' },
    { value: -11, label: 'app.filters.entrySources.-11' },
    { value: 37, label: 'app.filters.entrySources.37' },
  ];
  
  private _clearSelectedValues(): void {
    this._selectedValues = {
      'mediaType': [],
      'applications': [],
      'entrySources': [],
      'categories': [],
      'tags': [],
      'owners': [],
      'location': [],
    };
  }
  
  private _prepareFilterTags(): FilterTagItem[] {
    let label, tooltip;
    return this._appliedFilters.map(({ value, type }) => {
      switch (type) {
        case 'mediaType':
        case 'applications':
        case 'entrySources':
          label = this._translate.instant(`app.filters.${type}.${value}`);
          tooltip = this._translate.instant(`app.filters.${type}.title`) + `: ${label}`;
          return { value, type, label, tooltip };
        case 'categories':
          const category = value as CategoryData;
          label = category.name;
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${category.fullName}`;
          return { value, type, label, tooltip };
        case 'tags':
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${value}`;
          return { value, type, label: value, tooltip };
        case 'owners':
          const user = value as KalturaUser;
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${user.id}`;
          label = user.screenName;
          return { value, type, label, tooltip };
        case 'location':
          const location = value as LocationsFilterValue;
          label = this._translate.instant(`app.filters.location`);
          tooltip = this._translate.instant(`app.filters.location`) + `: ${location.country.name}`;
          if (location.region) {
            tooltip += ` > ${location.region.name}`;
            if (location.city) {
              tooltip += ` > ${location.city.name}`;
            }
          }
          return { value: 'location', type: 'location', label, tooltip };
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
        if (!this._selectedValues[item.type] || item.type === 'location') {
          this._selectedValues[item.type] = [item.value];
        } else {
          if (this._selectedValues[item.type].indexOf(item.value) === -1) {
            this._selectedValues[item.type].push(item.value);
          }
        }
      });
    } else {
      this._clearSelectedValues();
    }
  }
  
  public _onItemSelected(item: any, type: string): void {
    const value = { value: item, type };
    if (type === 'location') {
      const relevantFilterIndex = this._currentFilters.findIndex(filter => filter.type === 'location');
      if (relevantFilterIndex !== -1) {
        this._currentFilters.splice(relevantFilterIndex, 1, value);
      } else {
        this._currentFilters.push(value);
      }
    } else {
      this._currentFilters.push(value);
    }
  }
  
  public _onItemUnselected(item: any, type: string): void {
    const unselectedItemIndex = type === 'location'
      ? this._currentFilters.findIndex(filter => filter.type === 'location')
      : this._currentFilters.findIndex(filterItem => filterItem.value === item && filterItem.type === type);
    
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
    this._tags = this._prepareFilterTags();
    
    this.closeFilters.emit();
  }
  
  public _filtersAnimationDone(event: AnimationEvent): void {
    if (event.fromState === 'visible' && event.toState === 'hidden') {
      this._showFilters = false;
    }
  }
  
  public _advancedFiltersAnimationDone(event: AnimationEvent): void {
    if (event.fromState === 'visible' && event.toState === 'hidden') {
      this._showAdvancedFilters = false;
    }
  }
  
  public _removeFilter(item: { value: string, label: string, type: string }): void {
    this._onItemUnselected(item.value, item.type);
    this._apply();
  }
  
  public _removeAll(): void {
    this._clearAll();
    this._currentFilters = [];
    this._apply();
  }
}
