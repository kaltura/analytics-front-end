import { Input } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { KalturaReportInputFilter } from 'kaltura-ngx-client';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';

export abstract class EntryBase {
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      this._dateFilter = value;
      
      if (!this._dateFilter.applyIn || this._dateFilter.applyIn.indexOf(this._componentId) !== -1) {
        this._updateFilter();
        this._loadReport();
      }
    }
  }
  
  @Input() set refineFilter(value: RefineFilter) {
    if (value) {
      this._refineFilter = value;
      this._updateRefineFilter();
      this._loadReport();
    }
  }

  public _dateFilter: DateChangeEvent;
  protected _refineFilter: RefineFilter = [];
  
  protected abstract _componentId: string;
  
  protected abstract _loadReport(): void;
  
  protected abstract _updateFilter(): void;
  
  protected abstract _updateRefineFilter(): void;
  
  protected _refineFilterToServerValue(filter: KalturaReportInputFilter): void {
    refineFilterToServerValue(this._refineFilter, filter);
  }
}
