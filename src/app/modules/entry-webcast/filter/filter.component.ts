import { Component, Input } from '@angular/core';
import { LocationsFilterService } from 'shared/components/filter/location-filter/locations-filter.service';
import { DomainsFilterService } from 'shared/components/filter/domains-filter/domains-filter.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { animate, group, state, style, transition, trigger } from '@angular/animations';
import {FilterComponent, OptionItem} from 'shared/components/filter/filter.component';
import { ReportService } from 'shared/services';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { ViewConfig } from 'configuration/view-config';
import { FilterConfig } from "shared/components/filter/filter-base.service";
import { reportTypeMap } from "shared/utils/report-type-map";
import { KalturaReportType } from "kaltura-ngx-client";

@Component({
  selector: 'app-entry-webcast-filter',
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
export class EntryWebcastFilterComponent extends FilterComponent {
  public domainsFilterConfig: FilterConfig = {reportType: reportTypeMap(KalturaReportType.topDomainsWebcast)};
  public countriesFilterConfig: FilterConfig = {reportType: reportTypeMap(KalturaReportType.mapOverlayCountryWebcast)};
  public filterConfig: FilterConfig = {};

  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = {
        playbackType: {},
        owners: {},
        geo: {}
      };
    }
  }

  @Input() set entryId (id: string) {
    this.domainsFilterConfig.items = [{property: "entryIdIn", value: id}];
    this.countriesFilterConfig.items = [{property: "entryIdIn", value: id}];
    this.filterConfig.items = [{property: "entryIdIn", value: id}, {property: 'playbackTypeIn', value: 'dvr|live|vod'}];
  }

  public _playbackTypes: OptionItem[] = [
    { value: 'dvr', label: 'app.filters.playbackType.dvr' },
    { value: 'live', label: 'app.filters.playbackType.live' },
    { value: 'vod', label: 'app.filters.playbackType.vod' }
  ];
}


