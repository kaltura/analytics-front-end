import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, Output, TemplateRef } from '@angular/core';
import { OptionItem } from '../../../modules/audience/views/engagement/filter/filter.component';

@Component({
  selector: 'app-dropdown-filter',
  templateUrl: './dropdown-filter.component.html',
  styleUrls: ['./dropdown-filter.component.scss']
})
export class DropdownFilterComponent {
  @Input() set selectedFilters(value: any) {
    if (value !== undefined) {
      this._selectedValue = value;
    }
  }
  
  @Input() isLoading: boolean;
  @Input() label: string;
  @Input() options: OptionItem[] = [];
  @Input() filterPlaceHolder: string;
  @Input() selectedItemsLabel: string;
  @Input() defaultLabel: string;
  @Input() disabled: boolean;
  @Input() template: TemplateRef<any>;
  
  @Output() itemSelected = new EventEmitter();
  
  public _selectedValue = null;

  public _onSelectionChange(): void {
    this.itemSelected.emit(this._selectedValue);
  }
}
