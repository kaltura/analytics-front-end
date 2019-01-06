import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterService } from './locations-filter.service';

export interface LocationsFilterValueItem {
  name: string;
  id: string;
}

export interface LocationsFilterValue {
  country: LocationsFilterValueItem;
  region: LocationsFilterValueItem;
  city: LocationsFilterValueItem;
}

@Component({
  selector: 'app-location-filters',
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.scss']
})
export class LocationFilterComponent implements OnDestroy {
  @Input() set selectedFilters(value: LocationsFilterValue[]) {
    if (Array.isArray(value) && value.length) {
      const result = value[0];
      this._selectedCountry = result.country;
      this._selectedRegion = result.region;
      this._selectedCity = result.city;
    } else {
      this._selectedCountry = null;
      this._selectedRegion = null;
      this._selectedCity = null;
    }
  };
  
  @Input() set dateFilter(event: DateChangeEvent) {
    this._locationFilterService.updateDateFilter(event, () => {
      this._selectedCountry = null;
      this._selectedRegion = null;
      this._selectedCity = null;
    });
  }
  
  @Output() itemSelected = new EventEmitter<LocationsFilterValue>();
  
  public _selectedCountry: LocationsFilterValueItem;
  public _selectedRegion: LocationsFilterValueItem;
  public _selectedCity: LocationsFilterValueItem;
  
  constructor(public _locationFilterService: LocationsFilterService) {
  }
  
  ngOnDestroy() {
  
  }
  
  public _onItemSelected(item: { id: string, name: string }, type: string): void {
    switch (type) {
      case 'country':
        this._selectedCountry = item;
        this._selectedRegion = null;
        this._selectedCity = null;
        this._locationFilterService.resetRegion(this._selectedCountry.name);
        break;
      case 'region':
        this._selectedRegion = item;
        this._selectedCity = null;
        this._locationFilterService.resetCity(this._selectedCountry.name, this._selectedRegion.name);
        break;
      case 'city':
        this._selectedCity = item;
        break;
      default:
        break;
    }
    
    this.itemSelected.emit({
      country: this._selectedCountry || null,
      region: this._selectedRegion || null,
      city: this._selectedCity || null,
    });
  }
}
