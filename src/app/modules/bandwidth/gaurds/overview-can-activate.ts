import { Injectable } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { KalturaClient, PartnerGetInfoAction } from "kaltura-ngx-client";
import { analyticsConfig } from "configuration/analytics-config";
import { FrameEventManagerService, FrameEvents } from "shared/modules/frame-event-manager/frame-event-manager.service";
import { AnalyticsPermissionsService } from "shared/analytics-permissions/analytics-permissions.service";
import { AnalyticsPermissions } from "shared/analytics-permissions/analytics-permissions";

@Injectable()
export class OverviewCanActivate implements CanActivate {
    constructor(private _kalturaClient: KalturaClient,
                private _frameEventManager: FrameEventManagerService,
                private _permissions: AnalyticsPermissionsService,
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
                if (analyticsConfig.isHosted) {
                  this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/publisher`);
                } else {
                  this._router.navigate(['/bandwidth/publisher/']);
                }
              }
            },
            error => {
              observer.next(false);
              observer.complete();
              if (analyticsConfig.isHosted) {
                this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/publisher`);
              } else {
                this._router.navigate(['/bandwidth/publisher/']);
              }
            });
      });
    }
}
