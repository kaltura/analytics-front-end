import { Injectable } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { KalturaClient, PartnerGetInfoAction } from "kaltura-ngx-client";

@Injectable()
export class OverviewCanActivate implements CanActivate {
    constructor(private _kalturaClient: KalturaClient,
                private _router: Router) {
    }
    canActivate(route: ActivatedRouteSnapshot,  state: RouterStateSnapshot): Observable<boolean> {
      return new Observable((observer : any) => {
        this._kalturaClient
          .request(new PartnerGetInfoAction())
          .subscribe(
            (partner) => {
              if (partner.isSelfServe) {
                observer.next(true);
                observer.complete();
              } else {
                observer.next(false);
                observer.complete();
                this._router.navigate(['/bandwidth/publisher']);
              }
            },
            error => {
              observer.next(false);
              observer.complete();
              this._router.navigate(['/bandwidth/publisher']);
            });
      });
    }
}
