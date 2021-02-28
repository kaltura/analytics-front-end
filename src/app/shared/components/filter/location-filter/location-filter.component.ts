import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterService } from './locations-filter.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { FilterConfig } from "shared/components/filter/filter-base.service";


export interface LocationsFilterValueItem {
  name: string;
  id: string;
}

export interface LocationsFilterValue {
  country: LocationsFilterValueItem[];
  region: LocationsFilterValueItem[];
  city: LocationsFilterValueItem[];
}

@Component({
  selector: 'app-location-filters',
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.scss']
})
export class LocationFilterComponent implements OnDestroy {
  @Input() expandWidth = false;
  @Input() filterWarning: string;

  @Input() set selectedFilters(value: LocationsFilterValue[]) {
    if (Array.isArray(value) && value.length) {
      const result = value[0];
      this._selectedCountries = result.country;
      this._selectedRegions = result.region;
      this._selectedCities = result.city;
    } else {
      this._selectedCountries = [];
      this._selectedRegions = [];
      this._selectedCities = [];
    }
  }

  @Input() set filterConfig (config: FilterConfig) {
    if (config) {
      this._locationFilterService.filterConfig = config;
    }
  }

  @Input() set dateFilter(event: DateChangeEvent) {
    // use timeout to allow updating the filter before loading the data when in context (entry / category / user / playlist)
    setTimeout(() => {
      this._locationFilterService.updateDateFilter(event, () => {
        this._selectedCountries = [];
        this._selectedRegions = [];
        this._selectedCities = [];
      });
    }, 0);
  }

  @Output() itemSelected = new EventEmitter<LocationsFilterValue>();

  public _selectedCountries: LocationsFilterValueItem[];
  public _selectedRegions: LocationsFilterValueItem[];
  public _selectedCities: LocationsFilterValueItem[];

  constructor(public _locationFilterService: LocationsFilterService) {
  }

  ngOnDestroy() {

  }

  public _onItemSelected(items: { id: string, name: string }[], type: string): void {
    let countriesNames, regionsNames;
    switch (type) {
      case 'country':
        this._selectedCountries = items;
        this._selectedRegions = [];
        this._selectedCities = [];
        countriesNames = this._selectedCountries.map(({ name }) => name).join(analyticsConfig.valueSeparator);
        this._locationFilterService.resetRegion(countriesNames);
        break;
      case 'region':
        this._selectedRegions = items;
        this._selectedCities = [];
        countriesNames = this._selectedCountries.map(({ name }) => name).join(analyticsConfig.valueSeparator);
        regionsNames = this._selectedRegions.map(({ name }) => name).join(analyticsConfig.valueSeparator);
        this._locationFilterService.resetCity(countriesNames, regionsNames);
        break;
      case 'city':
        this._selectedCities = items;
        break;
      default:
        break;
    }

    this.itemSelected.emit({
      country: this._selectedCountries || [],
      region: this._selectedRegions || [],
      city: this._selectedCities || [],
    });
  }
}
