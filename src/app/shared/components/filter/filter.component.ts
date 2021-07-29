import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CategoryData } from 'shared/services/categories-search.service';
import { animate, AnimationEvent, group, state, style, transition, trigger } from '@angular/animations';
import { KalturaMediaEntry, KalturaUser } from 'kaltura-ngx-client';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterService } from './location-filter/locations-filter.service';
import { LocationsFilterValue } from './location-filter/location-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from 'configuration/analytics-config';
import { isEqual } from 'shared/utils/is-equals';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { ViewConfig } from 'configuration/view-config';
import { DomainsFilterService } from "shared/components/filter/domains-filter/domains-filter.service";
import { DomainsFilterValue } from "shared/components/filter/domains-filter/domains-filter.component";
import { FilterConfig } from "shared/components/filter/filter-base.service";

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
  providers: [LocationsFilterService, DomainsFilterService, KalturaLogger.createLogger('FilterComponent')],
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

  @Input() name = 'default';

  @Input() locationFiltersWarning: string;

  @Input() showAutocompleteGroup = true;

  @Input() filterConfig: FilterConfig = {};

  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = {
        mediaType: {},
        entrySource: {},
        tags: {},
        owners: {},
        context: {},
        categories: {},
        doamins: {},
        geo: {},
      };
    }
  }

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
    this._initialFilters = value;
  }

  @Input() set dateFilter(value: DateChangeEvent) {
    if (value !== undefined) {
      this._logger.debug('Update date filter', () => value);
      this._dateFilter = value;

      if (!this._dateFilter || !this._dateFilter.changeOnly || this._dateFilter.changeOnly !== 'timeUnits') {
        setTimeout(() => { // remove location filter in the next tick to avoid tags array update collisions
          if (this._currentFilters.find(({ type }) => type === 'location')) {
            this._removeFilter({ value: 'location', label: 'Location', type: 'location' });
          }
        });
      }

      this._toggleDisclaimer();
    }
  }

  @Output() filterChange = new EventEmitter<RefineFilter>();
  @Output() closeFilters = new EventEmitter<void>();

  protected _currentFilters: FilterItem[] = []; // local state
  protected _appliedFilters: FilterItem[] = [];
  protected _initialFilters: FilterItem[] = [];
  protected _showFilters: boolean;

  public _showDisclaimer = false;
  public _dateFilter: DateChangeEvent;
  public _selectedValues: { [key: string]: string[]; }; // local state
  public _state: string;
  public _tags: FilterTagItem[] = [];
  public _viewConfig: ViewConfig = {
    mediaType: {},
    entrySource: {},
    tags: {},
    owners: {},
    context: {},
    categories: {},
    domains: {},
    geo: {},
  };

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

  constructor(public _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService,
              private _logger: KalturaLogger) {
    this._clearAll();
  }

  public _mediaTypes: OptionItem[] = [
    { value: 'Video', label: 'app.filters.mediaType.Video' },
    // { value: 'Live', label: 'app.filters.mediaType.Live' }, // remove live for now
    { value: 'Audio', label: 'app.filters.mediaType.Audio' },
    // { value: 'interactiveVideo', label: 'app.filters.interactiveVideo' }, // TODO what is interactive video?
    { value: 'Image', label: 'app.filters.mediaType.Image' },
  ];

  public _playbackTypes: OptionItem[] = [
    { value: 'dvr', label: 'app.filters.playbackType.dvr' },
    { value: 'live', label: 'app.filters.playbackType.live' },
    { value: 'vod', label: 'app.filters.playbackType.vod' }
  ];
  public _playbackTypesAll: OptionItem[] = [
    { value: ['vod'], label: 'app.filters.playbackType.vod' },
    { value: ['dvr'], label: 'app.filters.playbackType.dvr' },
    { value: ['live'], label: 'app.filters.playbackType.live' },
    { value: ['all'], label: 'app.filters.playbackType.all' }
  ];

  public _entrySources: OptionItem[] = [ // TODO determine valid values
    { value: 'Upload', label: 'app.filters.entrySources.Upload' },
    { value: 'Kaltura Webcast', label: 'app.filters.entrySources.Webcasting' },
    { value: 'Kaltura Capture', label: 'app.filters.entrySources.Kaltura Capture' },
    { value: 'Classroom Capture', label: 'app.filters.entrySources.Classroom Capture' },
  ];

  protected _clearSelectedValues(): void {
    this._selectedValues = {
      'mediaType': [],
      'playbackType': [],
      'entrySources': [],
      'categories': [],
      'tags': [],
      'devices': [],
      'browser': [],
      'os': [],
      'owners': [],
      'users': [],
      'location': [],
      'countries': [],
      'domains': [],
      'entries': [],
      'context': [],
    };
  }

  protected _prepareFilterTags(): FilterTagItem[] {
    let label, tooltip;
    return this._appliedFilters.map(({ value, type }) => {
      switch (type) {
        case 'mediaType':
        case 'playbackType':
        case 'entrySources':
          label = this._translate.instant(`app.filters.${type}.${value}`);
          tooltip = this._translate.instant(`app.filters.${type}.title`) + `: ${label}`;
          return { value, type, label, tooltip };
        case 'devices':
        case 'browser':
        case 'os':
          label = value.name;
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${value.name}`;
          return { value, type, label, tooltip };
        case 'categories':
          const category = value as CategoryData;
          label = category.name;
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${category.fullName}`;
          return { value, type, label, tooltip };
        case 'context':
          const context = value as CategoryData;
          label = context.name;
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${context.fullName ? context.fullName : context.name}`;
          return { value, type, label, tooltip };
        case 'tags':
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${value}`;
          return { value, type, label: value, tooltip };
        case 'owners':
        case 'users':
          const user = value as KalturaUser;
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${user.id}`;
          label = user.screenName;
          return { value, type, label, tooltip };
        case 'entries':
          const entry = value as KalturaMediaEntry;
          tooltip = this._translate.instant(`app.filters.${type}`) + `: ${entry.id}`;
          label = entry.name;
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
        case 'domains':
          const domain = value as DomainsFilterValue;
          if (domain.domains && domain.domains.length) {
            label = this._translate.instant(`app.filters.domains`);
            tooltip = this._translate.instant(`app.filters.domains`) + `: ${domain.domains.map(({name}) => name)}`;
            if (domain.pages && domain.pages.length) {
              tooltip += ` > ${domain.pages.map(({name}) => name)}`;
            }
            return {value: 'domain', type: 'domains', label, tooltip};
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
        if (!this._selectedValues[item.type] || item.type === 'location' || item.type === 'domains') {
          this._selectedValues[item.type] = [item.value];
        } else {
          if (this._selectedValues[item.type].indexOf(item.value) === -1) {
            this._selectedValues[item.type].push(item.value);
          }
        }
      });
    }
  }

  protected _toggleDisclaimer(): void {
    if (this._dateFilter) {
      const disclaimerDate = DateFilterUtils.getMomentDate('04/01/2018');
      const startDate = DateFilterUtils.getMomentDate(this._dateFilter.startDate);
      this._showDisclaimer = this._tags.length && startDate.isBefore(disclaimerDate);
    } else {
      this._showDisclaimer = false;
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
    if (type === 'location' || type === 'domains') {
      const relevantFilterIndex = this._currentFilters.findIndex(filter => filter.type === type);
      if (relevantFilterIndex !== -1) {
        this._currentFilters.splice(relevantFilterIndex, 1, value);
      } else {
        this._currentFilters.push(value);
      }
    } else {
      this._currentFilters.push(value);
      this._updateLayout();
    }
  }

  public _onItemUnselected(item: any, type: string): void {
    this._logger.trace('Item removed by user', { item, type });
    let unselectedItemIndex = -1;
    if (type === 'location' || type === 'domains') {
      unselectedItemIndex = this._currentFilters.findIndex(filter => filter.type === type);
    } else if (type === 'countries') {
      const value = typeof item === 'string' ? item : item.id;
      unselectedItemIndex = this._currentFilters.findIndex(filterItem => filterItem.value.id === value && filterItem.type === type);
    } else {
      unselectedItemIndex = this._currentFilters.findIndex(filterItem => filterItem.value === item && filterItem.type === type);
      this._updateLayout();
    }

    if (unselectedItemIndex !== -1) {
      this._currentFilters.splice(unselectedItemIndex, 1);
    }
  }

  public _onPopupOpen(): void {
    this._logger.trace('Filters is opened by user, update selected values');
    this._currentFilters = [...this._appliedFilters];
    this._updateSelectedValues(this._currentFilters);
    if (this._currentFilters.length === 0) {
      this._initialFilters.forEach(filter => {
        this._onItemSelected(filter.value, filter.type);
      });
      this._updateSelectedValues(this._initialFilters);
    }
    this._updateLayout();
  }

  public _onPopupClose(): void {
    this._logger.trace('Filters is closed by user, update selected values');
    this._currentFilters = [];
    this._updateSelectedValues(this._currentFilters);
    this._updateLayout();
  }

  public _apply(forceApply = false): void {
    if (forceApply || !isEqual(this._currentFilters, this._appliedFilters)) {
      this._logger.trace('User applied filters, emit update event and close filters');

      // using spread to prevent passing by reference to avoid unwanted mutations
      this._appliedFilters = [...this._currentFilters];
      this._updateSelectedValues(this._currentFilters);
      this.filterChange.emit([...this._appliedFilters]);
      this._tags = this._prepareFilterTags();
      this._toggleDisclaimer();

      this._bottomPadding = this._tags.length ? '24px' : '0';
    } else {
      this._logger.info(`Filters weren't changed. Do nothing and close filters`);
    }

    this.closeFilters.emit();
  }

  public _filtersAnimationDone(event: AnimationEvent): void {
    if (event.fromState === 'visible' && event.toState === 'hidden') {
      this._showFilters = false;
    }
    this._updateLayout();
  }

  public _removeFilter(item: { value: string, label: string, type: string }): void {
    this._logger.trace('Item remove action is selected by user', { item });
    this._onItemUnselected(item.value, item.type);
    this._apply(true);
  }

  public _removeAll(): void {
    this._logger.trace('Remove all filters action is selected by user');
    this._clearAll();
    this._currentFilters = [];
    this._apply(true);
  }
}
