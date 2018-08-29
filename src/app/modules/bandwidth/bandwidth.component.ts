import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';


export interface SectionItem {
  label: string;
  active: boolean;
  route: string;
}

@Component({
    selector: 'app-bandwidth',
    templateUrl: './bandwidth.component.html',
    styleUrls: ['./bandwidth.component.scss'],
    providers: []
})
export class BandwidthComponent  {

  public _sections: SectionItem[] = [];

  constructor(private _router: Router, private _translate: TranslateService) {
    this._sections = [
      { label: this._translate.instant('app.bandwidth.publisherStorage'),
        active: true,
        route: 'bandwidth/publisher'
      },
      { label: this._translate.instant('app.bandwidth.usersStorage'),
        active: false,
        route: 'bandwidth/end-user'
      }
    ];
  }

  public navigateToView(route: string): void {
    // TODO add smart navigation according to permissions
    this._sections.forEach( (section: SectionItem) => {
      section.active = section.route === route;
    });
    this._router.navigate([route]);
  }

}

