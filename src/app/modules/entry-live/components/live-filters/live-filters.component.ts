import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FilterConfig} from "shared/components/filter/filter-base.service";
import {FilterComponent} from "shared/components/filter/filter.component";
import {ReportService} from "shared/services";
import {LocationsFilterService} from "shared/components/filter/location-filter/locations-filter.service";
import {DomainsFilterService} from "shared/components/filter/domains-filter/domains-filter.service";
import {KalturaLogger} from "@kaltura-ng/kaltura-logger";
import {animate, group, state, style, transition, trigger} from "@angular/animations";
import {DateChangeEvent} from 'shared/components/date-filter/date-filter.service';
import * as moment from 'moment';

@Component({
  selector: 'app-live-filters',
  templateUrl: './live-filters.component.html',
  styleUrls: ['./live-filters.component.scss'],
  providers: [ReportService, LocationsFilterService, DomainsFilterService, KalturaLogger.createLogger('EntryFilterComponent')],
  animations: [
    trigger('state', [
      state('visible', style({height: '*', opacity: 1})),
      state('hidden', style({height: '0', opacity: 0})),
      transition('* => visible', [
        style({height: '0', opacity: 0}),
        group([
          animate(300, style({height: '*'})),
          animate('400ms ease-in-out', style({'opacity': '1'}))
        ])
      ]),
      transition('visible => hidden', [
        style({height: '*', opacity: 1}),
        group([
          animate(300, style({height: 0})),
          animate('200ms ease-in-out', style({'opacity': '0'}))
        ])
      ])
    ])
  ]
})
export class LiveFiltersComponent extends FilterComponent implements OnChanges {
  public filterConfig: FilterConfig = {};

  @Input() set entryId(id: string) {
    this.filterConfig.items = [{property: "entryIdIn", value: id}];
  }

  public predefinedBrowsers = [
    'Chrome',
    'Firefox',
    'Safari',
    'Internet Explorer',
    'Microsoft Edge',
    'Opera',
    'Apple WebKit',
    'Vivaldi'
  ];

  public predefinedOSs = [
    'Windows',
    'Mac OS X',
    'Android',
    'Linux',
    'iOS',
    'Chrome OS',
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (!this._currentFilters.find(filter => filter.type === 'location') && changes['opened']?.currentValue) {
      this.dateFilter = {
        startDate: moment().unix(),
        endDate: moment().subtract(200, 'seconds').unix()
      } as DateChangeEvent;
    }
  }
}
