import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';

@Injectable()
export class LiveReportsGuard implements CanActivate {
  constructor(private _router: Router) {
  
  }
  
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (analyticsConfig.permissions.enableLiveViews) {
      this._router.navigate(['live/entries-live']);
      return;
    }
    return true;
  }
}
