import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { KalturaUser } from 'kaltura-ngx-client';
import { UsersFilterService } from './users-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { AutoComplete, SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';
import { ISubscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-users-filter',
  templateUrl: './users-filter.component.html',
  styleUrls: ['./users-filter.component.scss'],
  providers: [UsersFilterService]
})
export class UsersFilterComponent implements OnInit {
  @Input() hideLabels = true;
  @Input() disabled = false;

  @Output() filterChange: EventEmitter<KalturaUser[]> = new EventEmitter();

  @ViewChild('autocomplete') _autoComplete: AutoComplete;

  private _selectedUsers: KalturaUser[] = [];
  private _searchUsersSubscription: ISubscription;

  public _usersProvider = new Subject<SuggestionsProviderData>();

  constructor(private _translate: TranslateService, private _usersFilterService: UsersFilterService) {
  }

  ngOnInit() {
  }

  public _searchUsers(event): void {
    this._usersProvider.next({ suggestions : [], isLoading : true});

    if (this._searchUsersSubscription) {
      // abort previous request
      this._searchUsersSubscription.unsubscribe();
      this._searchUsersSubscription = null;
    }

    this._searchUsersSubscription = this._usersFilterService.searchUsers(event.query).subscribe(data => {
        const suggestions = [];
        (data || []).forEach((suggestedUser: KalturaUser) => {
          suggestedUser['__tooltip'] = suggestedUser.id;
          let isSelectable = !this._selectedUsers.find(user => {
            return user.id === suggestedUser.id;
          });
          suggestions.push({
            name: `${suggestedUser.screenName} (${suggestedUser.id})`,
            item: suggestedUser,
            isSelectable: isSelectable
          });
        });
        this._usersProvider.next({suggestions: suggestions, isLoading: false});
      },
      (err) => {
        this._usersProvider.next({ suggestions : [], isLoading : false, errorMessage : <any>(err.message || err)});
      });
  }

  public _convertUserInputToValidValue(value: string): any {
    let result = null;
    const tooltip = this._translate.instant('app.usersFilter.userTooltip', {0: value});
    if (value) {
      result =  {
        id : value,
        screenName: value,
        __tooltip: tooltip
      };
    }
    return result;
  }

  public _updateUsers(event): void {
    this._selectedUsers.push(event);
    this.filterChange.emit(this._selectedUsers);

    // clear user text from component
    this._autoComplete.clearValue();
  }

  public removeUser(id: string): void {
    this._selectedUsers = this._selectedUsers.filter((user: KalturaUser) => {
      return user.id !== id;
    });
    this.filterChange.emit(this._selectedUsers);
  }

  public removeAll(): void {
    this._selectedUsers = [];
    this.filterChange.emit(this._selectedUsers);
  }
}
