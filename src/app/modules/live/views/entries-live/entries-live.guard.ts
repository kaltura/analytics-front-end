import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';
import { AnalyticsPermissions } from 'shared/analytics-permissions/analytics-permissions';
import { AnalyticsPermissionsService } from 'shared/analytics-permissions/analytics-permissions.service';

@Injectable()
export class EntriesLiveGuard implements CanActivate {
  constructor(private _router: Router,
              private _permissions: AnalyticsPermissionsService) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this._permissions.hasPermission(AnalyticsPermissions.FEATURE_LIVE_ANALYTICS_DASHBOARD) && analyticsConfig.liveAnalytics) {
      this._router.navigate(['live/live-reports']);
      return;
    }

    return true;
  }
}
