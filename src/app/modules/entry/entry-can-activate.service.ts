import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Observable, Observer } from 'rxjs';
import { BaseEntryGetAction, KalturaAPIException, KalturaBaseEntry, KalturaClient, KalturaDetachedResponseProfile, KalturaEntryType, KalturaResponseProfileType } from 'kaltura-ngx-client';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import { NavigationDrillDownService } from "shared/services";

@Injectable()
export class EntryCanActivate implements CanActivate, OnDestroy {
  constructor(private _kalturaClient: KalturaClient, private _navigationDrillDownService: NavigationDrillDownService) { }
  
  canActivate(route: ActivatedRouteSnapshot,  state: RouterStateSnapshot): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      if (route.params['id']) {
        const baseEntryRequest =  new BaseEntryGetAction({ entryId: route.params['id'] })
            .setRequestOptions({
              responseProfile: new KalturaDetachedResponseProfile({
                type: KalturaResponseProfileType.includeFields,
                fields: 'type'
              })
            });
        
        this._kalturaClient.request(baseEntryRequest)
          .pipe(cancelOnDestroy(this))
          .subscribe(
            (entry: KalturaBaseEntry) => {
              if (entry.type === KalturaEntryType.playlist) {
                console.warn("Entry drill-down error - got playlist ID, navigating to playlist view");
                observer.next(false);
                observer.complete();
                this._navigationDrillDownService.drilldown('playlist', route.params['id'], true);
              } else {
                observer.next(true);
                observer.complete();
              }
            },
            (error: KalturaAPIException) => {
              console.warn(`Entry drill-down error: ${error.message}`);
              observer.next(false);
              observer.complete();
            }
          );
        
      } else {
        console.warn("Missing Entry ID - cannot navigate to entry page.");
        observer.next(false);
        observer.complete();
      }
    });
  }
  
  ngOnDestroy(): void {
  }
}
