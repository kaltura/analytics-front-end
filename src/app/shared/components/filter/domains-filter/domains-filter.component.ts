import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { DomainsFilterService } from './domains-filter.service';
import { analyticsConfig } from 'configuration/analytics-config';

export interface LocationsFilterValueItem {
  name: string;
  id: string;
}

export interface DomainsFilterValue {
  domains: LocationsFilterValueItem[];
  pages: LocationsFilterValueItem[];
}

@Component({
  selector: 'app-domains-filters',
  templateUrl: './domains-filter.component.html',
  styleUrls: ['./domains-filter.component.scss']
})
export class DomainsFilterComponent implements OnDestroy {
  @Input() expandWidth = false;

  @Input() set selectedFilters(value: DomainsFilterValue[]) {
    if (Array.isArray(value) && value.length) {
      const result = value[0];
      this._selectedDomains = result.domains;
      this._selectedPages = result.pages;
    } else {
      this._selectedDomains = [];
      this._selectedPages = [];
    }
  }

  @Input() set dateFilter(event: DateChangeEvent) {
    this._domainsFilterService.updateDateFilter(event, () => {
      this._selectedDomains = [];
      this._selectedPages = [];
    });
  }

  @Output() itemSelected = new EventEmitter<DomainsFilterValue>();

  public _selectedDomains: LocationsFilterValueItem[];
  public _selectedPages: LocationsFilterValueItem[];

  constructor(public _domainsFilterService: DomainsFilterService) {
  }

  ngOnDestroy() {

  }

  public _onItemSelected(items: { id: string, name: string }[], type: string): void {
    let domainsNames, pagesNames;
    switch (type) {
      case 'domains':
        this._selectedDomains = items;
        this._selectedPages = [];
        domainsNames = this._selectedDomains.map(({ name }) => name).join(analyticsConfig.valueSeparator);
        this._domainsFilterService.resetPages(domainsNames);
        break;
      case 'pages':
        this._selectedPages = items;
        domainsNames = this._selectedDomains.map(({ name }) => name).join(analyticsConfig.valueSeparator);
        pagesNames = this._selectedPages.map(({ name }) => name).join(analyticsConfig.valueSeparator);
        break;
      default:
        break;
    }

    this.itemSelected.emit({
      domains: this._selectedDomains || [],
      pages: this._selectedPages || []
    });
  }
}
