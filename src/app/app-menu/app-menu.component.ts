import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { analyticsConfig, MenuItem } from 'configuration/analytics-config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent implements OnDestroy {
  public _activeRoute = '';
  public _activeSubRoute = '';
  
  public _menu: MenuItem[] = [
    {
      id: 'audience',
      link: 'audience',
      label: 'app.modules.audience',
      items: [
        {
          id: 'engagement',
          link: 'audience/engagement',
          label: 'app.audience.menu.engagement',
        },
        {
          id: 'content-interactions',
          link: 'audience/content-interactions',
          label: 'app.audience.menu.contentInteractions',
        },
        {
          id: 'technology',
          link: 'audience/technology',
          label: 'app.audience.menu.technology',
        },
        {
          id: 'geo-location',
          link: 'audience/geo-location',
          label: 'app.audience.menu.geoLocation',
        },
      ]
    },
    {
      id: 'contributors',
      link: 'contributors',
      label: 'app.modules.contributors',
    },
    {
      id: 'bandwidth',
      link: 'bandwidth',
      label: 'app.modules.bandwidth',
      items: [
        {
          id: 'publisher',
          link: 'bandwidth/publisher',
          label: 'app.bandwidth.publisherStorage',
        },
        {
          id: 'end-user',
          link: 'bandwidth/end-user',
          label: 'app.bandwidth.usersStorage',
        },
      ]
    },
    {
      id: 'live',
      link: 'live',
      label: 'app.modules.live',
    },
  ];
  
  public get _showNavBar(): boolean {
    return analyticsConfig.showNavBar;
  }
  
  constructor(private _router: Router) {
    _router.events
      .pipe(cancelOnDestroy(this), filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.setSelectedRoute(event.urlAfterRedirects);
      });
    
    if (analyticsConfig.menuConfig && Array.isArray(analyticsConfig.menuConfig.items) && analyticsConfig.menuConfig.items.length) {
      this._menu = analyticsConfig.menuConfig.items;
    }
  }
  
  ngOnDestroy() {
  }
  
  private setSelectedRoute(path: string): void {
    const urlTree = this._router.parseUrl(path);
    if (urlTree.root.children['primary']) {
      const [activeRoute, activeSubRoute] = urlTree.root.children['primary'].segments.map(({ path }) => path);
      this._activeRoute = activeRoute || '';
      this._activeSubRoute = activeSubRoute || '';
    }
  }
  
  public _navigateToView(route: string): void {
    this._router.navigate([route]);
  }
  
  public _getSubMenu(id: string): MenuItem[] {
    const relevantMenu = this._menu.find(item => item.id === id);
    
    if (relevantMenu) {
      return relevantMenu.items || null;
    }
    
    return null;
  }
}
