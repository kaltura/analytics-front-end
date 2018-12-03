import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { KalturaClient, KalturaUser } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';

@Component({
  selector: 'app-city-filter',
  template: `
    <app-dropdown-filter [label]="'app.filters.city' | translate"
                         [disabled]="disabled"
                         [defaultLabel]="'app.filters.cityPlaceholder' | translate"
                         [selectedFilters]="selectedFilters"
                         (itemSelected)="itemSelected.emit($event)"></app-dropdown-filter>
  `,
})
export class CityFilterComponent implements OnDestroy {
  @Input() disabled: boolean;
  @Input() selectedFilters: KalturaUser[] = [];
  @Input() dateFilter: DateChangeEvent;

  @Output() itemSelected = new EventEmitter();
  @Output() itemUnselected = new EventEmitter();
  
  constructor(private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService) {
  }
  
  ngOnDestroy() {
  
  }
}
