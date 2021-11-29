import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { OsFilterService } from './os-filter.service';
import { FilterConfig } from "shared/components/filter/filter-base.service";
import {OptionItem} from "shared/components/filter/filter.component";

export interface OsFilterValueItem {
  name: string;
  id: string;
}

@Component({
  selector: 'app-webcast-os-filter',
  templateUrl: './os-filter.component.html',
  styleUrls: ['./os-filter.component.scss'],
  providers: [OsFilterService]
})
export class OsFilterComponent implements OnDestroy {
  @Input() set selectedFilters(value: OsFilterValueItem[]) {
    if (Array.isArray(value) && value.length) {
      this._selectedOs = value;
      this._setDiffer();
    } else {
      this._selectedOs = [];
    }
  }

  @Input() set predefinedOSs(value: string[]) {
    this._predefinedOSs = value.map((data, index) => ({
      value: { name: data, id: index.toString() },
      label: data,
    }));
  }

  @Input() set dateFilter(event: DateChangeEvent) {
    // use timeout to allow updating the filter before loading the data when in context (entry / category / user / playlist)
    setTimeout(() => {
      if (!this._predefinedOSs) {
        this._osFilterService.updateDateFilter(event, () => {
          this._selectedOs = [];
        });
      }
    }, 0);
  }

  @Input() set filterConfig (config: FilterConfig) {
    if (config) {
      this._osFilterService.filterConfig = config;
    }
  }

  @Output() itemSelected = new EventEmitter<OsFilterValueItem>();
  @Output() itemUnselected = new EventEmitter<OsFilterValueItem>();

  private _listDiffer: IterableDiffer<any>;

  public _selectedOs: OsFilterValueItem[];
  public _predefinedOSs: OptionItem[];

  constructor(private _listDiffers: IterableDiffers,
              public _osFilterService: OsFilterService) {
    this._setDiffer();
  }

  ngOnDestroy() {

  }

  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedOs);
  }

  public _onItemSelected(items: { id: string, name: string }[], type: string): void {
    if (type !== 'os') {
      return;
    }

    this._selectedOs = items;

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
