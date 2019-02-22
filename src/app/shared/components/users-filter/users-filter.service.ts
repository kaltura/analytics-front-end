import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient, KalturaUserFilter, KalturaFilterPager, UserListAction, KalturaUser } from 'kaltura-ngx-client';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Injectable()
export class UsersFilterService implements OnDestroy {

  constructor(private _kalturaClient: KalturaClient) {
  }

  public searchUsers(text: string): Observable<KalturaUser[]> {
    return Observable.create(
      observer => {
        const requestSubscription: ISubscription = this._kalturaClient.request(
          new UserListAction(
            {
              filter: new KalturaUserFilter({
                idOrScreenNameStartsWith : text
              }),
              pager: new KalturaFilterPager({
                pageIndex : 0,
                pageSize : 30
              })
            }
          )
        )
          .pipe(cancelOnDestroy(this))
          .subscribe(
            result => {
              observer.next(result.objects);
              observer.complete();
            },
            err => {
              observer.error(err);
            }
          );

        return () => {
          console.log('search users: cancelled');
          requestSubscription.unsubscribe();
        };
      });
  }

  ngOnDestroy() {
  }


}

