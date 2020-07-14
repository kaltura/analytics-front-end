import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { OsFilterService } from './os-filter.service';

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

  @Input() set dateFilter(event: DateChangeEvent) {
    this._osFilterService.updateDateFilter(event, () => {
      this._selectedOs = [];
    });
  }

  @Output() itemSelected = new EventEmitter<OsFilterValueItem>();
  @Output() itemUnselected = new EventEmitter<OsFilterValueItem>();

  private _listDiffer: IterableDiffer<any>;

  public _selectedOs: OsFilterValueItem[];

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
