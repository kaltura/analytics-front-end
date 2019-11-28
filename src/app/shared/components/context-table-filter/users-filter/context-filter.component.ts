import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CategoryListAction, KalturaCategory, KalturaCategoryFilter, KalturaClient, KalturaFilterPager } from 'kaltura-ngx-client';
import { Observable, Subject, Unsubscribable } from 'rxjs';
import { map } from 'rxjs/operators';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AutoComplete, SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';

@Component({
  selector: 'app-context-filter',
  template: `
      <kAutoComplete #searchContext
                     appendTo="body"
                     suggestionItemField="item"
                     suggestionLabelField="name"
                     field="screenName"
                     [placeholder]="'app.filters.filterContext' | translate"
                     [minLength]="3"
                     [suggestionsProvider]="_contextProvider"
                     (onSelect)="_onSuggestionSelected()"
                     (completeMethod)="_searchContexts($event, true)"></kAutoComplete>
  `,
})
export class ContextFilterComponent implements OnDestroy {
  @Input() set selectedContext(value: KalturaCategory[]) {
    if (Array.isArray(value)) {
      this._selectedContext = value;
    }
  }
  
  @Output() itemSelected = new EventEmitter();
  
  @ViewChild('searchContext', { static: false }) _autoComplete: AutoComplete = null;
  
  private _selectedContext: KalturaCategory[] = [];
  private _searchCategorySubscription: Unsubscribable;
  
  public _contextProvider = new Subject<SuggestionsProviderData>();
  
  constructor(private _kalturaServerClient: KalturaClient) {
  }
  
  ngOnDestroy() {
  
  }
  
  public _searchContexts(event, formControl?): void {
    this._contextProvider.next({ suggestions: [], isLoading: true });
    
    if (this._searchCategorySubscription) {
      // abort previous request
      this._searchCategorySubscription.unsubscribe();
      this._searchCategorySubscription = null;
    }
    
    this._searchCategorySubscription = this._searchCategoriesRequest(event.query).subscribe(data => {
        const suggestions = [];
        (data || []).forEach((suggestedCategory: KalturaCategory) => {
          suggestedCategory['__tooltip'] = suggestedCategory.id;
          let isSelectable = true;
          if (formControl) {
            isSelectable = !(this._selectedContext || []).find(category => category.id === suggestedCategory.id);
          }
          suggestions.push({
            name: `${suggestedCategory.name} (${suggestedCategory.id})`,
            item: suggestedCategory,
            isSelectable: isSelectable
          });
        });
        this._contextProvider.next({ suggestions: suggestions, isLoading: false });
      },
      (err) => {
        this._contextProvider.next({ suggestions: [], isLoading: false, errorMessage: <any>(err.message || err) });
      });
  }
  
  public _onSuggestionSelected(): void {
    
    const selectedItem = this._autoComplete.getValue() as KalturaCategory;
    // clear category text from component
    this._autoComplete.clearValue();
    
    if (selectedItem && !(this._selectedContext || []).find(category => category.id === selectedItem.id)) {
      this._selectedContext.push(selectedItem);
      this.itemSelected.emit(selectedItem);
    }
  }
  
  private _searchCategoriesRequest(text: string): Observable<KalturaCategory[]> {
    return this._kalturaServerClient
      .request(
        new CategoryListAction({
          filter: new KalturaCategoryFilter({
            freeText: text
          }),
          pager: new KalturaFilterPager({
            pageIndex: 0,
            pageSize: 30
          })
        }))
      .pipe(cancelOnDestroy(this), map(response => response.objects));
  }
}
