import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';

@Injectable()
export class EntriesLiveGuard implements CanActivate {
  constructor(private _router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!analyticsConfig.permissions.enableLiveViews && analyticsConfig.liveAnalytics) {
      this._router.navigate(['live/live-reports']);
      return;
    }

    return true;
  }
}
