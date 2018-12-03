import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { KalturaClient, KalturaUser } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-city-filter',
  template: `
    <app-dropdown-filter [label]="'app.filters.city' | translate"
                         [disabled]="disabled"
                         [defaultLabel]="'app.filters.cityPlaceholder' | translate"
                         [selectedFilters]="selectedFilters"
                         (itemSelected)="itemSelected.emit($event)"
                         (itemUnselected)="itemUnselected.emit($event)"></app-dropdown-filter>
  `,
})
export class CityFilterComponent implements OnDestroy {
  @Input() disabled: boolean;
  @Input() selectedFilters: KalturaUser[] = [];
  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
  constructor(private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService) {
  }
  
  ngOnDestroy() {
  
  }
}
