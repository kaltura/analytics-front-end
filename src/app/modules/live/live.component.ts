import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';

@Component({
  selector: 'app-live',
  template: '<router-outlet></router-outlet>'
})
export class LiveComponent implements OnInit {
  
  constructor(private _router: Router) {
  }
  
  ngOnInit() {
    const url = analyticsConfig.permissions.enableLiveViews ? 'live/entries-live' : 'live/live-reports';
    this._router.navigate([url]);
  }
}
