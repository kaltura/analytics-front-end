import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { KalturaClient, KalturaFilterPager, KalturaUser, KalturaUserFilter, UserListAction } from 'kaltura-ngx-client';
import { Observable, Subject, Unsubscribable } from 'rxjs';
import { map } from 'rxjs/operators';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-owners-filter',
  template: `
    <app-autocomplete-filter field="id"
                             suggestionLabelField="name"
                             tooltipResolver="__tooltip"
                             classField="__class"
                             [label]="'app.filters.owners' | translate"
                             [selectedFilters]="selectedFilters"
                             [provider]="_usersProvider"
                             [onItemAdding]="_convertUserInputToValidValue"
                             (search)="_searchUsers($event)"
                             (itemSelected)="itemSelected.emit($event)"
                             (itemUnselected)="itemUnselected.emit($event)"></app-autocomplete-filter>
  `,
})
export class OwnersFilterComponent implements OnDestroy {
  @Input() selectedFilters: KalturaUser[] = [];
  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
  private _searchUsersSubscription: Unsubscribable;
  
  public _usersProvider = new Subject();
  
  constructor(private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService) {
    this._convertUserInputToValidValue = this._convertUserInputToValidValue.bind(this); // fix scope issues when binding to a property
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
            const owners = this.selectedFilters || [];
            isSelectable = !owners.find(user => user.id === suggestedUser.id);
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
  
  public _convertUserInputToValidValue(value: string): { id: string, screenName: string, __tooltip: string, __class: string } {
    let result = null;
    const tooltip = this._translate.instant('app.filters.userNotFoundTooltip', { 0: value });
    if (value) {
      result = {
        id: value,
        screenName: value,
        __tooltip: tooltip,
        __class: 'userAdded'
      };
    }
    
    return result;
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
