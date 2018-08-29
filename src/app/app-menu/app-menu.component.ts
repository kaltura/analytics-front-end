import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent implements OnInit {

  public activeRoute = 'content';

  constructor(private _router: Router) { }

  ngOnInit() {
  }

  public navigateToView(route: string): void {
    // TODO add smart navigation according to permissions
    this.activeRoute = route;
    this._router.navigate([route]);
  }

}
