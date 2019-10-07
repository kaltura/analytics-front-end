import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { KalturaClient, KalturaFilterPager, KalturaUser, KalturaUserFilter, UserListAction } from 'kaltura-ngx-client';
import { Observable, Subject, Unsubscribable } from 'rxjs';
import { map } from 'rxjs/operators';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AutoComplete, SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';

@Component({
  selector: 'app-discovery-users-filter',
  template: `
    <kAutoComplete #searchUsers
                   suggestionItemField="item"
                   suggestionLabelField="name"
                   field="screenName"
                   [placeholder]="'app.filters.filterUsers' | translate"
                   [minLength]="3"
                   [suggestionsProvider]="_usersProvider"
                   (onSelect)="_onSuggestionSelected()"
                   (completeMethod)="_searchUsers($event, true)"></kAutoComplete>
  `,
})
export class UsersFilterComponent implements OnDestroy {
  @Input() set selectedUsers(value: KalturaUser[]) {
    if (Array.isArray(value)) {
      this._selectedUsers = value;
    }
  }
  @Output() itemSelected = new EventEmitter();
  
  @ViewChild('searchUsers', { static: false }) _autoComplete: AutoComplete = null;
  
  private _selectedUsers: KalturaUser[] = [];
  private _searchUsersSubscription: Unsubscribable;
  
  public _usersProvider = new Subject<SuggestionsProviderData>();
  
  constructor(private _kalturaServerClient: KalturaClient) {
  }
  
  ngOnDestroy() {
  
  }
  
  public _searchUsers(event, formControl?): void {
    this._usersProvider.next({ suggestions: [], isLoading: true });
    
    if (this._searchUsersSubscription) {
      // abort previous request
      this._searchUsersSubscription.unsubscribe();
      this._searchUsersSubscription = null;
    }
    
    this._searchUsersSubscription = this._searchUsersRequest(event.query).subscribe(data => {
        const suggestions = [];
        (data || []).forEach((suggestedUser: KalturaUser) => {
          suggestedUser['__tooltip'] = suggestedUser.id;
          let isSelectable = true;
          if (formControl) {
            isSelectable = !(this._selectedUsers || []).find(user => user.id === suggestedUser.id);
          }
          suggestions.push({
            name: `${suggestedUser.screenName} (${suggestedUser.id})`,
            item: suggestedUser,
            isSelectable: isSelectable
          });
        });
        this._usersProvider.next({ suggestions: suggestions, isLoading: false });
      },
      (err) => {
        this._usersProvider.next({ suggestions: [], isLoading: false, errorMessage: <any>(err.message || err) });
      });
  }
  
  public _onSuggestionSelected(): void {
    
    const selectedItem = this._autoComplete.getValue() as KalturaUser;
    // clear user text from component
    this._autoComplete.clearValue();
    
    if (selectedItem && !(this._selectedUsers || []).find(user => user.id === selectedItem.id)) {
      this._selectedUsers.push(selectedItem);
      this.itemSelected.emit(selectedItem);
    }
  }
  
  private _searchUsersRequest(text: string): Observable<KalturaUser[]> {
    return this._kalturaServerClient
      .request(
        new UserListAction({
          filter: new KalturaUserFilter({
            idOrScreenNameStartsWith: text
          }),
          pager: new KalturaFilterPager({
            pageIndex: 0,
            pageSize: 30
          })
        }))
      .pipe(cancelOnDestroy(this), map(response => response.objects));
  }
}
