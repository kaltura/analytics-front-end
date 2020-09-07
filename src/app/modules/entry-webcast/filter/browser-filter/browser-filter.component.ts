import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { BrowserFilterService } from './browser-filter.service';

export interface DeviceFilterValueItem {
  name: string;
  id: string;
}

@Component({
  selector: 'app-webcast-browser-filter',
  templateUrl: './browser-filter.component.html',
  styleUrls: ['./browser-filter.component.scss'],
  providers: [BrowserFilterService]
})
export class BrowserFilterComponent implements OnDestroy {
  @Input() set selectedFilters(value: DeviceFilterValueItem[]) {
    if (Array.isArray(value) && value.length) {
      this._selectedBrowsers = value;
      this._setDiffer();
    } else {
      this._selectedBrowsers = [];
    }
  }

  @Input() set dateFilter(event: DateChangeEvent) {
    this._browsersFilterService.updateDateFilter(event, () => {
      this._selectedBrowsers = [];
    });
  }

  @Output() itemSelected = new EventEmitter<DeviceFilterValueItem>();
  @Output() itemUnselected = new EventEmitter<DeviceFilterValueItem>();

  private _listDiffer: IterableDiffer<any>;

  public _selectedBrowsers: DeviceFilterValueItem[];

  constructor(private _listDiffers: IterableDiffers,
              public _browsersFilterService: BrowserFilterService) {
    this._setDiffer();
  }

  ngOnDestroy() {

  }

  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedBrowsers);
  }

  public _onItemSelected(items: { id: string, name: string }[], type: string): void {
    if (type !== 'browser') {
      return;
    }

    this._selectedBrowsers = items;

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
