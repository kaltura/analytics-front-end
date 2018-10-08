import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent implements OnInit, OnDestroy {

  public showNavBar = analyticsConfig.showNavBar;
  public activeRoute = '';
  public activeSubRoute = '';

  constructor(private _router: Router) {
    _router.events
      .pipe(cancelOnDestroy(this))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.setSelectedRoute(event.urlAfterRedirects);
        }
      });
  }

  ngOnInit() {
    // when hosted - navigate to required route
    if (window.parent && (window.parent.location.href !== window.location.href)) {
      const href = window.parent.location.href
      if (href.indexOf('/analytics/dashboard') > -1) {
        this.navigateToView('/content/top-content');
      }
      if (href.indexOf('/analytics/contributors') > -1) {
        this.navigateToView('/system/platforms');
      }
      if (href.indexOf('/analytics/audience') > -1) {
        this.navigateToView('/users/top-contributors');
      }
      if (href.indexOf('/analytics/publisher') > -1) {
        this.navigateToView('/bandwidth/publisher');
      }
      if (href.indexOf('/analytics/enduser') > -1) {
        this.navigateToView('/bandwidth/end-user');
      }
      if (href.indexOf('/analytics/live') > -1) {
        this.navigateToView('/live/live-reports');
      }
    }
  }

  private setSelectedRoute(path: string): void {
    const paths = path.split('/');
    this.activeRoute = paths[1];
    if (paths.length > 2) {
      this.activeSubRoute = paths[2];
    }
  }

  public navigateToView(route: string): void {
    // TODO add smart navigation according to permissions
    this._router.navigate([route]);
  }

  ngOnDestroy() {
  }

}
