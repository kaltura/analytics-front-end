import { Component } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Component({
    selector: 'app-bandwidth',
    templateUrl: './bandwidth.component.html',
    styleUrls: ['./bandwidth.component.scss'],
    providers: [
      KalturaLogger.createLogger('BandwidthComponent'),
    ]
})
export class BandwidthComponent  {


  constructor() {
  }


}

