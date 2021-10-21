import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import {
  KalturaClient, KalturaDetachedResponseProfile,
  KalturaFilterPager,
  KalturaPartner,
  KalturaPartnerFilter, KalturaResponseProfileType,
  PartnerListAction
} from 'kaltura-ngx-client';
import { Observable, Subject, Unsubscribable } from 'rxjs';
import { map } from 'rxjs/operators';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-account-filter',
  template: `
    <app-autocomplete-filter field="name"
                             suggestionLabelField="name"
                             tooltipResolver="__tooltip"
                             classField="__class"
                             [label]="label"
                             [selectedFilters]="selectedFilters"
                             [placeholder]="placeholder"
                             [provider]="_accountsProvider"
                             (search)="_searchAccounts($event)"
                             (itemSelected)="itemSelected.emit($event)"
                             (itemUnselected)="itemUnselected.emit($event)"></app-autocomplete-filter>
  `,
})
export class AccountFilterComponent implements OnDestroy {
  @Input() label = this._translate.instant('app.filters.accounts');
  @Input() placeholder = this._translate.instant('app.filters.accountsPlaceholder');
  @Input() selectedFilters: KalturaPartner[] = [];

  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();

  private _searchAccountsSubscription: Unsubscribable;

  public _accountsProvider = new Subject();

  constructor(private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService) {
  }

  ngOnDestroy() {

  }

  public _searchAccounts(event, formControl?): void {
    this._accountsProvider.next({ suggestions: [], isLoading: true });

    if (this._searchAccountsSubscription) {
      // abort previous request
      this._searchAccountsSubscription.unsubscribe();
      this._searchAccountsSubscription = null;
    }

    this._searchAccountsSubscription = this._searchAccoutsRequest(event.query).subscribe(data => {
        const suggestions = [];
        (data || []).forEach((suggestedAccount: KalturaPartner) => {
          suggestedAccount['__tooltip'] = suggestedAccount.id;
          let isSelectable = true;
          if (formControl) {
            const accounts = this.selectedFilters || [];
            isSelectable = !accounts.find(account => account.id === suggestedAccount.id);
          }
          suggestions.push({
            name: `${suggestedAccount.name} (${suggestedAccount.id})`,
            item: suggestedAccount,
            isSelectable: isSelectable
          });
        });
        this._accountsProvider.next({ suggestions: suggestions, isLoading: false });
      },
      (err) => {
        this._accountsProvider.next({ suggestions: [], isLoading: false, errorMessage: <any>(err.message || err) });
      });
  }

  private _searchAccoutsRequest(text: string): Observable<KalturaPartner[]> {
    const filter = new KalturaPartnerFilter({
      statusIn: '1,2' // active and blocked
    });
    if (/^-{0,1}\d+$/.test(text)){
      // number - search pid
      filter.idIn = text;
    } else {
      // string - search account name
      filter.nameMultiLikeOr = text;
    }

    // update desired fields of partners
    const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
      type: KalturaResponseProfileType.includeFields,
      fields: 'id,name'
    });

    return this._kalturaServerClient
      .request(
        new PartnerListAction({
          filter,
          pager: new KalturaFilterPager({
            pageIndex: 0,
            pageSize: 50
          })
        }).setRequestOptions({ responseProfile }))
      .pipe(cancelOnDestroy(this), map(response => response.objects));
  }
}
