import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { ESearchSearchEntryAction, KalturaClient, KalturaESearchEntryFieldName, KalturaESearchEntryItem, KalturaESearchEntryOperator, KalturaESearchEntryParams, KalturaESearchItemType, KalturaESearchOperatorType, KalturaMediaEntry, KalturaPager } from 'kaltura-ngx-client';
import { Observable, Subject, Unsubscribable } from 'rxjs';
import { AutoComplete, SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-engagement-entries-filter',
  template: `
      <kAutoComplete #searchEntries *ngIf="_showEntryFilter"
                     appendTo="body"
                     suggestionItemField="item"
                     suggestionLabelField="name"
                     field="name"
                     [placeholder]="'app.filters.filterEntries' | translate"
                     [minLength]="5"
                     [suggestionsProvider]="_entriesProvider"
                     (onSelect)="_onSuggestionSelected()"
                     (completeMethod)="_searchEntries($event, true)"></kAutoComplete>
  `,
})
export class EntriesEngagementFilterComponent implements OnDestroy {
  @Input() set selectedEntries(value: KalturaMediaEntry[]) {
    if (Array.isArray(value)) {
      this._selectedEntries = value;
    }
  }
  @Input() _showEntryFilter = true;

  @Output() itemSelected = new EventEmitter();

  @ViewChild('searchEntries') _autoComplete: AutoComplete = null;

  private _selectedEntries: KalturaMediaEntry[] = [];
  private _searchEntriesSubscription: Unsubscribable;

  public _entriesProvider = new Subject<SuggestionsProviderData>();

  constructor(private _kalturaServerClient: KalturaClient) {
  }

  ngOnDestroy() {

  }

  public _searchEntries(event, formControl?): void {
    this._entriesProvider.next({ suggestions: [], isLoading: true });

    if (this._searchEntriesSubscription) {
      // abort previous request
      this._searchEntriesSubscription.unsubscribe();
      this._searchEntriesSubscription = null;
    }

    this._searchEntriesSubscription = this._searchEntriesRequest(event.query).subscribe(data => {
        const suggestions = [];
        (data || []).forEach((suggestedEntry: KalturaMediaEntry) => {
          suggestedEntry['__tooltip'] = suggestedEntry.id;
          let isSelectable = true;
          if (formControl) {
            isSelectable = !(this._selectedEntries || []).find(entry => entry.id === suggestedEntry.id);
          }
          suggestions.push({
            name: `${suggestedEntry.name} (${suggestedEntry.id})`,
            item: suggestedEntry,
            isSelectable: isSelectable
          });
        });
        this._entriesProvider.next({ suggestions: suggestions, isLoading: false });
      },
      (err) => {
        this._entriesProvider.next({ suggestions: [], isLoading: false, errorMessage: <any>(err.message || err) });
      });
  }

  public _onSuggestionSelected(): void {

    const selectedItem = this._autoComplete.getValue() as KalturaMediaEntry;
    // clear entry text from component
    this._autoComplete.clearValue();

    if (selectedItem && !(this._selectedEntries || []).find(entry => entry.id === selectedItem.id)) {
      this._selectedEntries.push(selectedItem);
      this.itemSelected.emit(selectedItem);
    }
  }

  private _searchEntriesRequest(text: string): Observable<KalturaMediaEntry[]> {
    const request = new ESearchSearchEntryAction({
      searchParams: new KalturaESearchEntryParams({
        searchOperator: new KalturaESearchEntryOperator({
          operator: KalturaESearchOperatorType.orOp,
          searchItems: [
            new KalturaESearchEntryItem({
              fieldName: KalturaESearchEntryFieldName.id,
              itemType: KalturaESearchItemType.exactMatch,
              searchTerm: text,
            }),
            new KalturaESearchEntryItem({
              fieldName: KalturaESearchEntryFieldName._name,
              itemType: KalturaESearchItemType.partial,
              searchTerm: text,
            }),
          ]
        })
      }),
      pager: new KalturaPager({ pageSize: 30 }),
    });
    return this._kalturaServerClient.request(request)
      .pipe(cancelOnDestroy(this), map(response => response.objects.map(obj => obj.object as KalturaMediaEntry)));
  }
}
