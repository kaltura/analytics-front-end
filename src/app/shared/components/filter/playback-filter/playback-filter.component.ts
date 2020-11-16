import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, Output } from '@angular/core';

import { KalturaCategory } from "kaltura-ngx-client";
import { OptionItem } from "shared/components/filter/filter.component";

@Component({
  selector: 'app-playback-filter',
  templateUrl: './playback-filter.component.html',
  styleUrls: ['./playback-filter.component.scss']
})
export class PlaybackFilterComponent {
  @Input() set selectedFilters(value: string[]) {
    if (Array.isArray(value)) {
      this._selectedValue = value;
      this._setDiffer();
    }
  }
  @Input() disabled = false;
  @Input() label: string;
  @Input() options: OptionItem[] = [];

  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();

  private _listDiffer: IterableDiffer<any>;

  public _selectedValue: string[] = ['vod'];

  constructor(private _listDiffers: IterableDiffers) {
    this._setDiffer();
  }

  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedValue);
  }

  public _onSelectionChange(): void {
    const changes = this._listDiffer.diff(this._selectedValue || []);

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
