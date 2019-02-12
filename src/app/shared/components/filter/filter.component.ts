import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CategoryData } from 'shared/services/categories-search.service';
import { animate, AnimationEvent, group, state, style, transition, trigger } from '@angular/animations';
import { KalturaUser } from 'kaltura-ngx-client';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterService } from './location-filter/locations-filter.service';
import { LocationsFilterValue } from './location-filter/location-filter.component';
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';

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
  providers: [LocationsFilterService, KalturaLogger.createLogger('FilterComponent')],
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
  @HostBinding('style.padding-bottom') _bottomPadding = '0';

  @Input() set opened(value: boolean) {
    const isOpened = !!value;
  
    this._bottomPadding = isOpened || this._tags.length ? '24px' : '0';
    
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
      this._logger.debug('Update date filter', () => value);
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
  
  protected _currentFilters: FilterItem[] = []; // local state
  protected _appliedFilters: FilterItem[] = [];
  protected _showFilters: boolean;

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
    this._updateLayout();
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
    this._updateLayout();
  }
  
  constructor(private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService,
              private _logger: KalturaLogger) {
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
  
  protected _clearSelectedValues(): void {
    this._selectedValues = {
      'mediaType': [],
      'entrySources': [],
      'categories': [],
      'tags': [],
      'owners': [],
      'location': [],
      'countries': [],
    };
  }
  
  protected _prepareFilterTags(): FilterTagItem[] {
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
          if (location.country && location.country.length) {
            label = this._translate.instant(`app.filters.location`);
            tooltip = this._translate.instant(`app.filters.location`) + `: ${location.country.map(({name}) => name)}`;
            if (location.region && location.region.length) {
              tooltip += ` > ${location.region.map(({name}) => name)}`;
              if (location.city && location.city.length) {
                tooltip += ` > ${location.city.map(({name}) => name)}`;
              }
            }
            return {value: 'location', type: 'location', label, tooltip};
          } else {
            return null;
          }
        case 'countries':
          return { value: value.id, type, label: value.name, tooltip: value.name };
        default:
          return null;
      }
    }).filter(Boolean);
  }
  
  protected _clearAll(): void {
    this._logger.trace('Clear all tags called');
    this._clearSelectedValues();
    this._currentFilters = [];
    this._appliedFilters = [];
  }
  
  protected _updateSelectedValues(values: FilterItem[]): void {
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

  protected _updateLayout(): void {
    if (analyticsConfig.isHosted) {
      const height = document.getElementById('analyticsApp').getBoundingClientRect().height;
      this._logger.info('Send update layout event to the host app', { height });
      setTimeout(() => {
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height });
      }, 350);
    }
  }
  
  public _onItemSelected(item: any, type: string): void {
    this._logger.trace('Item selected by user', { item, type });
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
    this._logger.trace('Item removed by user', { item, type });
    let unselectedItemIndex = -1;
    if (type === 'location') {
      unselectedItemIndex = this._currentFilters.findIndex(filter => filter.type === 'location');
    } else if (type === 'countries') {
      unselectedItemIndex = this._currentFilters.findIndex(filterItem => filterItem.value.id === item.id && filterItem.type === type);
    } else {
      unselectedItemIndex = this._currentFilters.findIndex(filterItem => filterItem.value === item && filterItem.type === type);
    }

    if (unselectedItemIndex !== -1) {
      this._currentFilters.splice(unselectedItemIndex, 1);
    }
  }
  
  public _onPopupOpen(): void {
    this._logger.trace('Filters is opened by user, update selected values');
    this._currentFilters = [...this._appliedFilters];
    this._updateSelectedValues(this._currentFilters);
  }
  
  public _onPopupClose(): void {
    this._logger.trace('Filters is closed by user, update selected values');
    this._currentFilters = [];
    this._updateSelectedValues(this._currentFilters);
  }
  
  public _apply(): void {
    this._logger.trace('User applied filters, emit update event and close filters');
  
    // using spread to prevent passing by reference to avoid unwanted mutations
    this._appliedFilters = [...this._currentFilters];
    this._updateSelectedValues(this._currentFilters);
    this.filterChange.emit([...this._appliedFilters]);
    this._tags = this._prepareFilterTags();
  
    this._bottomPadding = this._tags.length ? '24px' : '0';
    
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
    this._logger.trace('Item remove action is selected by user', { item });
    this._onItemUnselected(item.value, item.type);
    this._apply();
  }
  
  public _removeAll(): void {
    this._logger.trace('Remove all filters action is selected by user');
    this._clearAll();
    this._currentFilters = [];
    this._apply();
  }
}
