import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterService } from './locations-filter.service';

export interface LocationsFilterValue {
  country: string;
  region: string;
  city: string;
}

@Component({
  selector: 'app-location-filters',
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.scss']
})
export class LocationFilterComponent implements OnDestroy {
  @Input() set selectedFilters(value: LocationsFilterValue[]) {
    if (Array.isArray(value) && value.length) {
      console.warn(value);
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
  
  public _selectedCountry: any;
  public _selectedRegion: any;
  public _selectedCity: any;
  
  constructor(public _locationFilterService: LocationsFilterService) {
  }
  
  ngOnDestroy() {
  
  }
  
  public _onItemSelected(item: { id: string, name: string }, type: string): void {
    switch (type) {
      case 'country':
        this._selectedCountry = item.name;
        this._selectedRegion = null;
        this._selectedCity = null;
        this._locationFilterService.resetRegion(this._selectedCountry);
        break;
      case 'region':
        this._selectedRegion = item.name;
        this._selectedCity = null;
        this._locationFilterService.resetCity(this._selectedCountry, this._selectedRegion);
        break;
      case 'city':
        this._selectedCity = item.name;
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
