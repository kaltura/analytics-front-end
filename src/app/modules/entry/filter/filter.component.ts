import { Component, Input } from '@angular/core';
import { LocationsFilterService } from 'shared/components/filter/location-filter/locations-filter.service';
import { DomainsFilterService } from 'shared/components/domain-filter/domains-filter.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { animate, group, state, style, transition, trigger } from '@angular/animations';
import { FilterComponent } from 'shared/components/filter/filter.component';
import { ReportService } from 'shared/services';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { ViewConfig } from 'configuration/view-config';

@Component({
  selector: 'app-entry-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  providers: [ReportService, LocationsFilterService, DomainsFilterService, KalturaLogger.createLogger('EntryFilterComponent')],
  animations: [
    trigger('state', [
      state('visible', style({ height: '*', opacity: 1 })),
      state('hidden', style({ height: '0', opacity: 0 })),
      transition('* => visible', [
        style({ height: '0', opacity: 0 }),
        group([
          animate(300, style({ height: '*' })),
          animate('400ms ease-in-out', style({ 'opacity': '1' }))
        ])
      ]),
      transition('visible => hidden', [
        style({ height: '*', opacity: 1 }),
        group([
          animate(300, style({ height: 0 })),
          animate('200ms ease-in-out', style({ 'opacity': '0' }))
        ])
      ])
    ])
  ]
})
export class EntryFilterComponent extends FilterComponent {
  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = {
        geo: {},
        owners: {},
        categories: {},
      };
    }
  }
}
