import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';
import { AnalyticsPermissions } from 'shared/analytics-permissions/analytics-permissions';

@Component({
  selector: 'app-live',
  template: '<router-outlet></router-outlet>'
})
export class LiveComponent implements OnInit {
  
  constructor(private _router: Router,
              private _permissions: AnalyticsPermissionsService) {
  }
  
  ngOnInit() {
    const url = this._permissions.hasPermission(AnalyticsPermissions.FEATURE_LIVE_ANALYTICS_DASHBOARD) ? 'live/entries-live' : 'live/live-reports';
    this._router.navigate([url]);
  }
}
