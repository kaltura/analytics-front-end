import { Component, Input } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Component({
  selector: 'app-ve-mini-insights',
  templateUrl: './mini-insights.component.html',
  styleUrls: ['./mini-insights.component.scss'],
  providers: [
    KalturaLogger.createLogger('VEMiniInsightsComponent')
  ]
})
export class VEMiniInsightsComponent {

  protected _componentId = 've-mini-insights';

  @Input() data: { countries: string[], countriesCount: number, unregistered: number } =  { countries: [], countriesCount: 0, unregistered: 0 };

  constructor() {
  }

}
