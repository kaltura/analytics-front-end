import { Input } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineChangeEvent } from '../filter/filter.component';

export abstract class TopContributorsBaseReportComponent {
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      this._dateFilter = value;
      this._updateFilter();
      this._loadReport();
    }
  }
  
  @Input() set refineFilter(value: RefineChangeEvent) {
    if (value) {
      this._refineFilter = value;
      this._loadReport();
    }
  }
  
  protected _dateFilter: DateChangeEvent;
  protected _refineFilter: RefineChangeEvent;
  
  protected abstract _loadReport(): void;
  
  protected abstract _updateFilter(): void;
}
