import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, Output } from '@angular/core';
import { OptionItem } from '../filter/filter.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-autocomplete-filter',
  templateUrl: './autocomplete-filter.component.html',
  styleUrls: ['./autocomplete-filter.component.scss']
})
export class AutocompleteFilterComponent {
  @Input() provider = new Subject();

  @Input() set selectedFilters(value: string[]) {
    if (Array.isArray(value)) {
      this._selectedValue = value;
      this._setDiffer();
    }
  }

  @Input() label: string;
  @Input() tooltipResolver: string | Function;
  @Input() classField: string;
  @Input() suggestionLabelField: string;
  @Input() field: string;
  @Input() placeholder: string;
  @Input() onItemAdding: (value: string) => { id: string, screenName: string, __tooltip: string, __class: string };

  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  @Output() search = new EventEmitter();

  private _listDiffer: IterableDiffer<any>;

  public _selectedValue: string[] = [];

  constructor(private _listDiffers: IterableDiffers) {
    this._setDiffer();
  }

  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedValue);
  }

  public _onSelectionChange(): void {
    setTimeout(() => { // run in the next tick to get up-to-date selected value
      const changes = this._listDiffer.diff(this._selectedValue || []);

      if (changes) {
        changes.forEachAddedItem((record: IterableChangeRecord<any>) => {
          this.itemSelected.emit(record.item);
        });

        changes.forEachRemovedItem((record: IterableChangeRecord<any>) => {
          this.itemUnselected.emit(record.item);
        });
      }
    });
  }
}
