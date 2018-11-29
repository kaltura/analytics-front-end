import { Input } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from '../filter/filter.component';
import { KalturaReportInputFilter } from 'kaltura-ngx-client';

export abstract class EngagementBaseReportComponent {
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      this._dateFilter = value;
      this._updateFilter();
      this._loadReport();
    }
  }
  
  @Input() set refineFilter(value: RefineFilter) {
    if (value) {
      this._refineFilter = value;
      this._updateRefineFilter();
      this._loadReport();
    }
  }
  
  protected _dateFilter: DateChangeEvent;
  protected _refineFilter: RefineFilter = [];
  
  protected abstract _loadReport(): void;
  
  protected abstract _updateFilter(): void;
  
  protected abstract _updateRefineFilter(): void;
  
  protected _refineFilterToServerValue(filter: KalturaReportInputFilter): void {
    const categories = this._refineFilter
      .filter(({ type }) => type === 'categories')
      .map(({ value }) => value.id)
      .join(',');
    
    if (categories) {
      filter.categories = categories;
    } else {
      delete filter.categories;
    }
  }
}
