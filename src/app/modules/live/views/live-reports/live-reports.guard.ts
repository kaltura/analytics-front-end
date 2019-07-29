import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AnalyticsPermissionsService } from 'shared/analytics-permissions/analytics-permissions.service';
import { AnalyticsPermissions } from 'shared/analytics-permissions/analytics-permissions';

@Injectable()
export class LiveReportsGuard implements CanActivate {
  constructor(private _router: Router,
              private _permissions: AnalyticsPermissionsService,) {
    
  }
  
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this._permissions.hasPermission(AnalyticsPermissions.FEATURE_LIVE_ANALYTICS_DASHBOARD)) {
      this._router.navigate(['live/entries-live']);
      return;
    }
    return true;
  }
}
