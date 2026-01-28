import {Component, EventEmitter, Input, Output, TemplateRef, ViewChild} from '@angular/core';
import { OptionItem } from '../filter/filter.component';

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
  @Input() templateType: string;

  @Output() itemSelected = new EventEmitter();
  @ViewChild('holder') iconHolder: any;

  public _selectedValue = null;

  public _onSelectionChange(): void {
    this.itemSelected.emit(this._selectedValue);
  }

  public onIconLoadError(event): void {
    event.stopImmediatePropagation();
    event.currentTarget.style.display = 'none';
    if (this.iconHolder) {
      this.iconHolder.nativeElement.classList.add('kIconfile-small');
    }
  }
}
