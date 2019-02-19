import { Component } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Component({
    selector: 'app-audience',
    templateUrl: './audience.component.html',
    styleUrls: ['./audience.component.scss'],
    providers: [KalturaLogger.createLogger('AudienceComponent')]
})
export class AudienceComponent  {


  constructor() {
  }


}

