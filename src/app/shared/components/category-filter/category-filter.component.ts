import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, Output, ViewChild } from '@angular/core';
import { OptionItem } from '../filter/filter.component';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { CategoryData } from 'shared/services/categories-search.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';

@Component({
  selector: 'app-category-filter',
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss']
})
export class CategoryFilterComponent {
  @Input() set selectedFilters(value: CategoryData[]) {
    if (Array.isArray(value)) {
      this._selectedValue = value;
      this._setDiffer();
    }
  }
  
  @Input() label: string;
  @Input() linkLabel: string;
  @Input() options: OptionItem[] = [];

  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
  @ViewChild('categoriesPopup') _categoriesPopup: PopupWidgetComponent;
  
  private _listDiffer: IterableDiffer<any>;
  
  public _selectedValue: CategoryData[] = [];
  
  constructor(private _listDiffers: IterableDiffers,
              private _frameEventManager: FrameEventManagerService) {
    this._setDiffer();
  }
  
  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedValue);
  }

  public _openCategoriesBrowser(): void {
    this._categoriesPopup.open();
  }
  
  public _updateCategories(value: CategoryData[]): void {
    this._selectedValue = value;

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
  
  public _updateHost(opened: boolean): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(opened ? FrameEvents.ModalOpened : FrameEvents.ModalClosed);
    }
  }
}
