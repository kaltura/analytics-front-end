import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { KalturaClient, KalturaUser } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-region-filter',
  template: `
    <app-dropdown-filter [label]="'app.filters.region' | translate"
                         [disabled]="disabled"
                         [defaultLabel]="'app.filters.regionPlaceholder' | translate"
                         [selectedFilters]="selectedFilters"
                         (itemSelected)="itemSelected.emit($event)"></app-dropdown-filter>
  `,
})
export class RegionFilterComponent implements OnDestroy {
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
