import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, Output } from '@angular/core';
import { OptionItem } from '../filter.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-category-filter',
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss']
})
export class CategoryFilterComponent {
  @Input() set selectedFilters(value: string[]) {
    if (Array.isArray(value)) {
      this._selectedValue = value;
    }
  }
  
  @Input() label: string;
  @Input() linkLabel: string;
  @Input() options: OptionItem[] = [];

  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
  public _selectedValue: string[] = [];

  public _openCategoriesBrowser(): void {
  
  }
}
