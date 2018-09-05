import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DateFilterService } from './date-filter.service';
import { DateFilterUtils } from './date-filter-utils';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import { DateRangeType, DateRanges, DateChangeEvent } from './date-filter.service';

@Component({
  selector: 'app-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent implements OnInit {

  @Input() dateRangeType: DateRangeType = DateRangeType.LongTerm;

  @Output() filterChange: EventEmitter<DateChangeEvent> = new EventEmitter();

  public dateRangeItems: SelectItem[] = [];
  public selectedDateRange: DateRanges;

  public timeUnitsItems: SelectItem[] = [
    {label: this._translate.instant('app.dateFilter.monthly'), value: KalturaReportInterval.months},
    {label: this._translate.instant('app.dateFilter.daily'), value: KalturaReportInterval.days},
  ];
  public selectedTimeUnit: KalturaReportInterval = KalturaReportInterval.months;

  public startDate: Date;
  public endDate: Date;
  public hasError = false;

  constructor(private _translate: TranslateService, private _dateFilterService: DateFilterService) {
  }

  ngOnInit() {
    this.dateRangeItems = this._dateFilterService.getDateRange(this.dateRangeType);
    this.selectedDateRange = DateRanges.CurrentMonth; // might need to change for different range type
    setTimeout( () => {
      this.updateCalendars(); // use a timeout to allow data binding to complete
    }, 0);
  }

  public updateCalendars(): void {
    const dates = this._dateFilterService.getCalendars(this.selectedDateRange);
    this.startDate = dates.startDate;
    this.endDate = dates.endDate;
    if (this.validateDates()) {
      this.triggerChangeEvent();
    }
  }

  public onTimeUnitsChange(): void {
    if (this.validateDates()) {
      this.triggerChangeEvent();
    }
  }

  public onCalendarChange(): void {
    this.selectedDateRange = DateRanges.Custom;
    if (this.validateDates()) {
      this.triggerChangeEvent();
    }
  }

  private validateDates(): boolean {
    this.hasError = this.startDate > this.endDate;
    return !this.hasError && !!this.startDate && !!this.endDate;
  }

  private triggerChangeEvent(): void {
    this.filterChange.emit({
      startDate: DateFilterUtils.toServerDate(this.startDate),
      endDate: DateFilterUtils.toServerDate(this.endDate),
      startDay: DateFilterUtils.getDay(this.startDate),
      endDay: DateFilterUtils.getDay(this.endDate),
      timeUnits: this.selectedTimeUnit,
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset()
    });
  }

}
