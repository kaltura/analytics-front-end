import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, Output, TemplateRef } from '@angular/core';
import { OptionItem } from '../../../modules/audience/views/engagement/filter/filter.component';

@Component({
  selector: 'app-dropdown-filter',
  templateUrl: './multiselect-filter.component.html',
  styleUrls: ['./multiselect-filter.component.scss']
})
export class MultiselectFilterComponent {
  @Input() set selectedFilters(value: string[]) {
    if (Array.isArray(value)) {
      this._selectedValue = value;
      this._setDiffer();
    }
  }
  
  @Input() label: string;
  @Input() options: OptionItem[] = [];
  @Input() filterPlaceHolder: string;
  @Input() selectedItemsLabel: string;
  @Input() defaultLabel: string;
  @Input() template: TemplateRef<any>;
  
  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();

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
      const changes = this._listDiffer.diff(this._selectedValue);
      
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
