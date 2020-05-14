import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { OptionItem } from '../filter/filter.component';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { CategoryData } from 'shared/services/categories-search.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: 'app-category-filter',
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss']
})
export class CategoryFilterComponent implements OnInit, OnDestroy {
  @Input() set selectedFilters(value: CategoryData[]) {
    if (Array.isArray(value)) {
      this._selectedValue = value;
      this._setDiffer();
    }
  }
  @Input() disabled = false;
  @Input() label: string;
  @Input() linkLabel: string;
  @Input() options: OptionItem[] = [];
  @Input() popupTitle: string;
  @Input() popupFilterPlaceholder: string;

  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
  @ViewChild('categoriesPopup', { static: false }) _categoriesPopup: PopupWidgetComponent;
  
  public _rootCategoryId: number = null;
  public _selectedValue: CategoryData[] = [];
  
  private _listDiffer: IterableDiffer<any>;
  
  constructor(private _listDiffers: IterableDiffers,
              private _route: ActivatedRoute,
              private _router: Router,
              private _frameEventManager: FrameEventManagerService) {
    this._setDiffer();
  }
  
  ngOnInit() {
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        const url = this._router.url;
        const _categoryId = params['id'];
        if (url.indexOf('/category/') > -1 && _categoryId) {
          this._rootCategoryId = parseInt(_categoryId);
        }
      });
  }
  
  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedValue);
  }

  public _openCategoriesBrowser(): void {
    if (!this.disabled) {
      this._categoriesPopup.open();
    }
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
  
  ngOnDestroy(): void {
  }
}
