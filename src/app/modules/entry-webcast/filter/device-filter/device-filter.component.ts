import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { DeviceFilterService } from './device-filter.service';

export interface DeviceFilterValueItem {
  name: string;
  id: string;
}

@Component({
  selector: 'app-webcast-device-filter',
  templateUrl: './device-filter.component.html',
  styleUrls: ['./device-filter.component.scss'],
  providers: [DeviceFilterService]
})
export class DeviceFilterComponent implements OnDestroy {
  @Input() set selectedFilters(value: DeviceFilterValueItem[]) {
    if (Array.isArray(value) && value.length) {
      this._selectedDevices = value;
      this._setDiffer();
    } else {
      this._selectedDevices = [];
    }
  }

  @Input() set dateFilter(event: DateChangeEvent) {
    this._devicesFilterService.updateDateFilter(event, () => {
      this._selectedDevices = [];
    });
  }

  @Output() itemSelected = new EventEmitter<DeviceFilterValueItem>();
  @Output() itemUnselected = new EventEmitter<DeviceFilterValueItem>();

  private _listDiffer: IterableDiffer<any>;

  public _selectedDevices: DeviceFilterValueItem[];

  constructor(private _listDiffers: IterableDiffers,
              public _devicesFilterService: DeviceFilterService) {
    this._setDiffer();
  }

  ngOnDestroy() {

  }

  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedDevices);
  }

  public _onItemSelected(items: { id: string, name: string }[], type: string): void {
    if (type !== 'device') {
      return;
    }

    this._selectedDevices = items;

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
