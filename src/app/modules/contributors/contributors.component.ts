import { Component } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Component({
    selector: 'app-contributors',
    templateUrl: './contributors.component.html',
    styleUrls: ['./contributors.component.scss'],
    providers: [
      KalturaLogger.createLogger('ContributorsComponent'),
    ]
})
export class ContributorsComponent  {


  constructor() {
  }


}

