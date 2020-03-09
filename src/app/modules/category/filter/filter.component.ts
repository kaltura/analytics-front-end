import { Component, Input } from '@angular/core';
import { LocationsFilterService } from 'shared/components/filter/location-filter/locations-filter.service';
import { DomainsFilterService } from 'shared/components/domain-filter/domains-filter.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { animate, group, state, style, transition, trigger } from '@angular/animations';
import {FilterComponent, FilterItem, OptionItem} from 'shared/components/filter/filter.component';
import { ReportService } from 'shared/services';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { ViewConfig } from 'configuration/view-config';
import {KalturaCategory} from "kaltura-ngx-client";

@Component({
  selector: 'app-cat-filter',
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
export class CatFilterComponent extends FilterComponent {
  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = {
        mediaType: {},
        entrySource: {},
        tags: {},
        owners: {},
        context: {},
        categories: {},
        geo: {},
      };
    }
  }
  @Input() set category(value: KalturaCategory) {
    this._contextTypes[1].value = [{...value}];
  }
  
  public contextSelected = false;
  public subCategoriesSelected = false;
  
  public _contextTypes: OptionItem[] = [
    { value: [], label: 'app.category.contextAll' },
    { value: [], label: 'app.category.contextCategory' }
  ];
  
  public openFilter(filter: string): void {
    if (filter === "context") {
      this._onItemSelected(this._contextTypes[1].value[0], filter);
      this.contextSelected = true;
      this._apply();
    }
  }
  
  public _apply(forceApply = false): void {
    super._apply(forceApply);
    this.contextSelected = this._appliedFilters.filter(filter => filter.type === 'context').length > 0;
    this.subCategoriesSelected = this._appliedFilters.filter(filter => filter.type === 'categories').length > 0;
  }
  
}
