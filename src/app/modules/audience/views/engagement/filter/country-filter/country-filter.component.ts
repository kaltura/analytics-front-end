import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { KalturaClient, KalturaUser } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-country-filter',
  template: `
    <app-dropdown-filter [label]="'app.filters.country' | translate"
                         [defaultLabel]="'app.filters.countryPlaceholder' | translate"
                         [selectedFilters]="selectedFilters"
                         (itemSelected)="itemSelected.emit($event)"
                         (itemUnselected)="itemUnselected.emit($event)"></app-dropdown-filter>
  `,
})
export class CountryFilterComponent implements OnDestroy {
  @Input() selectedFilters: KalturaUser[] = [];
  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
  constructor(private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService) {
  }
  
  ngOnDestroy() {
  
  }
}
