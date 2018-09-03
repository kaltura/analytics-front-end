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
  }

  private setSelectedRoute(path: string): void {
    this.activeRoute = path.split('/')[1];
  }

  public navigateToView(route: string): void {
    // TODO add smart navigation according to permissions
    this._router.navigate([route]);
  }

  ngOnDestroy() {
  }

}
