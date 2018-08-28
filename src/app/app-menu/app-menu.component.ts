import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent implements OnInit {

  constructor(private _router: Router) { }

  ngOnInit() {
  }

  public navigateToView(route: string): void {
    // TODO add smart navigation according to permissions, set active route visualization
    this._router.navigate([route]);
  }

}
