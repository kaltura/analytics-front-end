import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { analyticsConfig, MenuItem } from 'configuration/analytics-config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter } from 'rxjs/operators';
import { menu } from './app-menu.config';
@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent implements OnDestroy {
  public _activeRoute = '';
  public _activeSubRoute = '';
  
  public _menu: MenuItem[] = menu;
  
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
