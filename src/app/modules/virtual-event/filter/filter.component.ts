import { Component, Input } from '@angular/core';
import { LocationsFilterService } from 'shared/components/filter/location-filter/locations-filter.service';
import { DomainsFilterService } from 'shared/components/filter/domains-filter/domains-filter.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { animate, group, state, style, transition, trigger } from '@angular/animations';
import { FilterComponent, OptionItem } from 'shared/components/filter/filter.component';
import { ReportService } from 'shared/services';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { ViewConfig } from 'configuration/view-config';
import { KalturaVirtualEvent } from "kaltura-ngx-client";
import { TranslateService } from "@ngx-translate/core";
import { FrameEventManagerService } from "shared/modules/frame-event-manager/frame-event-manager.service";
import { FilterConfig } from "shared/components/filter/filter-base.service";

@Component({
  selector: 'app-ve-filter',
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
export class VirtualEventFilterComponent extends FilterComponent {
  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = {
        geo: {},
      };
    }
  }
  public filterConfig: FilterConfig = {};

  @Input() set virtualEvent(value: KalturaVirtualEvent) {
    if (value) {
      this.filterConfig = {
        items: [{property: 'virtualEventIdIn', value: value.id.toString()}]
      };
    }
  }

  constructor(_translate: TranslateService,
              _frameEventManager: FrameEventManagerService,
              _logger: KalturaLogger) {
    super(_translate, _frameEventManager, _logger);
  }

  public _apply(forceApply = false): void {
    super._apply(forceApply);
  }

}
