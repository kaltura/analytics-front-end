import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, Output } from '@angular/core';
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
      this._setDiffer();
    } else {
      this._selectedCountries = [];
    }
  }
  @Input() set entryId (val: string) {
    if (val) {
      this._locationFilterService.updateFilter('entryIdIn', val);
    }
  }
  @Input() set userId (val: string) {
    if (val) {
      this._locationFilterService.updateFilter('userIds', val);
    }
  }
  @Input() set playlistId (val: string) {
    if (val) {
      this._locationFilterService.updateFilter('playlistIdIn', val);
    }
  }
  @Input() set rootEntryId (val: string) {
    if (val) {
      this._locationFilterService.updateFilter('rootEntryIdIn', val);
    }
  }
  @Input() set categoryId (val: string) {
    if (val) {
      this._locationFilterService.updateFilter('categoriesIdsIn', val);
    }
  }
  @Input() set dateFilter(event: DateChangeEvent) {
    // use timeout to allow updating the filter before loading the data when in context (entry / category / user / playlist)
    setTimeout(() => {
      this._locationFilterService.updateDateFilter(event, () => {
        this._selectedCountries = [];
      });
    }, 0);
  }

  @Output() itemSelected = new EventEmitter<LocationsFilterValueItem>();
  @Output() itemUnselected = new EventEmitter<LocationsFilterValueItem>();

  private _listDiffer: IterableDiffer<any>;

  public _selectedCountries: LocationsFilterValueItem[];

  constructor(private _listDiffers: IterableDiffers,
              public _locationFilterService: LocationsFilterService) {
    this._setDiffer();
  }

  ngOnDestroy() {

  }

  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedCountries);
  }

  public _onItemSelected(items: { id: string, name: string }[], type: string): void {
    if (type !== 'country') {
      return;
    }

    this._selectedCountries = items;

    const changes = this._listDiffer.diff(items);

    if (changes) {
      changes.forEachAddedItem((record: IterableChangeRecord<any>) => {
        this.itemSelected.emit(record.item);
      });

      changes.forEachRemovedItem((record: IterableChangeRecord<any>) => {
        this.itemUnselected.emit(record.item);
      });
    }
  }
}
