import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, Output, ViewChild } from '@angular/core';
import { OptionItem } from '../filter.component';
import { TranslateService } from '@ngx-translate/core';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';

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
  
  @ViewChild('categoriesPopup') _categoriesPopup: PopupWidgetComponent;
  
  public _selectedValue: string[] = [];

  public _openCategoriesBrowser(): void {
    this._categoriesPopup.open();
  }
  
  public _updateCategories(event): void {
    console.warn(event);
  }
}
