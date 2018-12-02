import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, Output } from '@angular/core';
import { OptionItem } from '../../../modules/audience/views/engagement/filter/filter.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-autocomplete-filter',
  templateUrl: './autocomplete-filter.component.html',
  styleUrls: ['./autocomplete-filter.component.scss']
})
export class AutocompleteFilterComponent {
  @Input() set selectedFilters(value: string[]) {
    if (Array.isArray(value)) {
      this._selectedValue = value;
      this._setDiffer();
    }
  }
  
  @Input() label: string;
  @Input() options: OptionItem[] = [];
  
  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
  private _listDiffer: IterableDiffer<any>;
  
  public _selectedValue: string[] = [];
  public _tagsProvider = new Subject<any>();
  
  constructor(private _listDiffers: IterableDiffers) {
    this._setDiffer();
  }
  
  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedValue);
  }
  
  public _onSelectionChange(): void {
    const changes = this._listDiffer.diff(this._selectedValue);
    
    if (changes) {
      changes.forEachAddedItem((record: IterableChangeRecord<any>) => {
        this.itemSelected.emit(record.item);
      });
      
      changes.forEachRemovedItem((record: IterableChangeRecord<any>) => {
        this.itemUnselected.emit(record.item);
      });
    }
  }
  
  public _searchTags(event: any): void {
    console.warn(event);
  }
}
