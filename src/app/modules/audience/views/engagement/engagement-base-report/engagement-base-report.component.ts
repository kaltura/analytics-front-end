import { Input } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineChangeEvent } from '../filter/filter.component';

export abstract class EngagementBaseReportComponent {
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      console.log(value);
      this._loadReport();
    }
  }
  
  @Input() set refineFilter(value: RefineChangeEvent) {
    if (value) {
      console.log(value);
      this._loadReport();
    }
  }
  
  protected abstract _loadReport(): void;
}
