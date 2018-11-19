import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent implements OnDestroy {

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

  private setSelectedRoute(path: string): void {
    const urlTree = this._router.parseUrl(path);
    const [activeRoute, activeSubRoute] = urlTree.root.children['primary'].segments.map(({ path }) => path);
    this.activeRoute = activeRoute || '';
    this.activeSubRoute = activeSubRoute || '';
  }
  public navigateToView(route: string): void {
    // TODO add smart navigation according to permissions
    this._router.navigate([route]);
  }

  ngOnDestroy() {
  }

}
