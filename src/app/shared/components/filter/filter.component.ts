import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CategoryData } from 'shared/services/categories-search.service';
import { animate, AnimationEvent, group, state, style, transition, trigger } from '@angular/animations';
import { KalturaUser } from 'kaltura-ngx-client';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterService } from './location-filter/locations-filter.service';
import { LocationsFilterValue } from './location-filter/location-filter.component';
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";

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
      
      if (!this._dateFilter || !this._dateFilter.changeOnly || this._dateFilter.changeOnly !== 'timeUnits') {
        setTimeout(() => { // remove location filter in the next tick to avoid tags array update collisions
          if (this._currentFilters.find(({ type }) => type === 'location')) {
            this._removeFilter({ type: 'location', value: null, label: null });
          }
        });
      }
    }
  }
  
  @Output() filterChange = new EventEmitter<RefineFilter>();
  @Output() closeFilters = new EventEmitter<void>();
  
  private _currentFilters: FilterItem[] = []; // local state
  private _appliedFilters: FilterItem[] = [];
  private _showFilters: boolean;

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
    this.updateLayout();
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
    this.updateLayout();
  }
  
  constructor(private _translate: TranslateService, private _frameEventManager: FrameEventManagerService) {
    this._clearAll();
  }
  
  public _mediaTypes: OptionItem[] = [
    { value: 'Video', label: 'app.filters.mediaType.Video' },
    { value: 'Live', label: 'app.filters.mediaType.Live' },
    { value: 'Audio', label: 'app.filters.mediaType.Audio' },
    // { value: 'interactiveVideo', label: 'app.filters.interactiveVideo' }, // TODO what is interactive video?
    { value: 'Image', label: 'app.filters.mediaType.Image' },
  ];
  
  public _entrySources: OptionItem[] = [ // TODO determine valid values
    { value: 'Upload', label: 'app.filters.entrySources.Upload' },
    { value: 'Webcasting', label: 'app.filters.entrySources.Webcasting' },
    { value: 'Kaltura Capture', label: 'app.filters.entrySources.Kaltura Capture' },
    { value: 'Classroom Capture', label: 'app.filters.entrySources.Classroom Capture' },
  ];
  
  private _clearSelectedValues(): void {
    this._selectedValues = {
      'mediaType': [],
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
          tooltip = this._translate.instant(`app.filters.location`) + `: ${location.country.map(({ name }) => name)}`;
          if (location.region) {
            tooltip += ` > ${location.region.map(({ name }) => name)}`;
            if (location.city) {
              tooltip += ` > ${location.city.map(({ name }) => name)}`;
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
    this._clearSelectedValues();

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
    }
  }

  private updateLayout(): void {
    setTimeout(() => {
      this._frameEventManager.publish(FrameEvents.UpdateLayout, {'height': document.getElementById('analyticsApp').getBoundingClientRect().height});
    }, 350);
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
