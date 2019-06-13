import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DateRange, DateRangeServerValue, FiltersService, TimeInterval } from './filters.service';
import { SelectItem } from 'primeng/api';
import { KalturaReportInterval } from 'kaltura-ngx-client';

export interface DateFiltersChangedEvent {
  dateRange: DateRange;
  dateRangeServerValue: DateRangeServerValue;
  timeInterval: TimeInterval;
  timeIntervalServerValue: KalturaReportInterval;
  initialRun: boolean;
}

@Component({
  selector: 'app-live-discovery-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss']
})
export class FiltersComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<DateFiltersChangedEvent>();
  
  public _dateRangeOptions: SelectItem[];
  public _timeIntervalOptions: SelectItem[];
  public _selectedTimeInterval: TimeInterval;
  public _selectedDateRange = DateRange.LastMin;
  
  constructor(private _filterService: FiltersService) {
    this._dateRangeOptions = _filterService.getDateRangeList();
    this._updateInterval();
  }
  
  ngOnInit(): void {
    this._onFilterChange(true);
  }
  
  private _updateInterval(selected = null): void {
    this._timeIntervalOptions = this._filterService.getTimeIntervalList(this._selectedDateRange);
  
    this._selectedTimeInterval = selected && !this._timeIntervalOptions.find(({ value }) => value === selected).disabled
      ? selected
      : this._timeIntervalOptions.find(({ disabled }) => !disabled).value; // find first enabled option
  }
  
  public _onFilterChange(firstRun = false): void {
    this._updateInterval(this._selectedTimeInterval);
  
    this.filtersChanged.emit({
      initialRun: firstRun,
      dateRange: this._selectedDateRange,
      dateRangeServerValue: this._filterService.getDateRangeServerValue(this._selectedDateRange),
      timeInterval: this._selectedTimeInterval,
      timeIntervalServerValue: this._filterService.getTimeIntervalServerValue(this._selectedTimeInterval),
    });
  }
}
