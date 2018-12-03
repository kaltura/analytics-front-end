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
    this._locationFilterService.updateDateFilter(event);
  }
  
  @Output() itemSelected = new EventEmitter();
  
  public _selectedCountry: any;
  public _selectedRegion: any;
  public _selectedCity: any;
  
  constructor(public _locationFilterService: LocationsFilterService) {
  }
  
  ngOnDestroy() {
  
  }
  
  public _onItemSelected(item: any, type: string): void {
    console.warn(item, type);
  }
}
