import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { KalturaUser } from 'kaltura-ngx-client';
import { UsersFilterService } from './users-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';
import { ISubscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-users-filter',
  templateUrl: './users-filter.component.html',
  styleUrls: ['./users-filter.component.scss'],
  providers: [UsersFilterService]
})
export class UsersFilterComponent implements OnInit {

  @Output() filterChange: EventEmitter<KalturaUser[]> = new EventEmitter();

  public _selectedUsers: KalturaUser[] = [];
  public _usersProvider = new Subject<SuggestionsProviderData>();
  private _searchUsersSubscription: ISubscription;

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
    let users = [];
    this._selectedUsers.forEach((user: KalturaUser) => {
      users.push(user);
    });
    this.filterChange.emit(users);
  }
}
