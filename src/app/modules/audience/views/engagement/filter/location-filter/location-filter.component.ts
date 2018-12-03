import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { KalturaUser } from 'kaltura-ngx-client';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { LocationsFilterService } from './locations-filter.service';

@Component({
  selector: 'app-location-filters',
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.scss']
})
export class LocationFilterComponent implements OnDestroy {
  @Input() selectedFilters: KalturaUser[] = [];
  
  @Input() set dateFilter(event: DateChangeEvent) {
    this._locationFilterService.updateDateFilter(event, () => {
      this._selectedCountry = null;
      this._selectedRegion = null;
      this._selectedCity = null;
    });
  }
  @Output() itemSelected = new EventEmitter();
  
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
    console.warn(item, type);
  }
}
