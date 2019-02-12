import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterValueItem } from 'shared/components/filter/location-filter/location-filter.component';
import { LocationsFilterService } from 'shared/components/filter/location-filter/locations-filter.service';

@Component({
  selector: 'app-country-filter',
  templateUrl: './country-filter.component.html',
  styleUrls: ['./country-filter.component.scss']
})
export class CountryFilterComponent implements OnDestroy {
  @Input() set selectedFilters(value: LocationsFilterValueItem[]) {
    if (Array.isArray(value) && value.length) {
      this._selectedCountries = value;
    } else {
      this._selectedCountries = [];
    }
  }
  
  @Input() set dateFilter(event: DateChangeEvent) {
    this._locationFilterService.updateDateFilter(event, () => {
      this._selectedCountries = [];
    });
  }
  
  @Output() itemSelected = new EventEmitter<LocationsFilterValueItem[]>();
  
  public _selectedCountries: LocationsFilterValueItem[];
  
  constructor(public _locationFilterService: LocationsFilterService) {
  }
  
  ngOnDestroy() {
  
  }
  
  public _onItemSelected(items: { id: string, name: string }[], type: string): void {
    if (type === 'country') {
      this._selectedCountries = items;
    }
    
    this.itemSelected.emit(this._selectedCountries || []);
  }
}
