import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DateChangeEvent, TimeSelectorService } from './time-selector.service';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BrowserService } from 'shared/services';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateRange } from '../filters/filters.service';
import * as moment from 'moment';

@Component({
  selector: 'app-time-selector',
  templateUrl: './time-selector.component.html',
  styleUrls: ['./time-selector.component.scss'],
  providers: [TimeSelectorService]
})
export class TimeSelectorComponent implements OnDestroy {
  @Input() selectedTimeUnit = KalturaReportInterval.months;

  @Input() set dateRange(value: DateRange) {
    if (value) {
      this._defaultDateRange = value;
      this._dateRange = value;
    } else {
      this._dateRange = this._defaultDateRange;
    }
  }
  
  @Input() showCompare = true;
  
  @Output() filterChange: EventEmitter<DateChangeEvent> = new EventEmitter();
  
  public _defaultDateRange = DateRange.LastMin;
  public _dateRange = this._defaultDateRange;
  public _maxDate = new Date();
  public _minDate = moment().subtract(7, 'days').toDate();
  public _fromTime = new Date();
  public _toTime = new Date();
  
  public leftDateRangeItems: SelectItem[] = [];
  public rightDateRangeItems: SelectItem[] = [];
  public selectedDateRange: DateRange;
  private lastSelectedDateRange: DateRange; // used for revert selection
  
  public viewItems: SelectItem[] = [
    { label: this._translate.instant('app.dateFilter.preset'), value: 'preset' },
    { label: this._translate.instant('app.dateFilter.specific'), value: 'specific' },
  ];
  public selectedView = 'preset';
  
  public _dateRangeLabel = '';
  public specificDateRange: Date[] = [new Date(), new Date()];
  
  private startDate: Date;
  private endDate: Date;
  
  public get _applyDisabled(): boolean {
    return this.selectedView === 'specific' && this.specificDateRange.filter(Boolean).length !== 2;
  }
  
  constructor(private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _dateFilterService: TimeSelectorService,
              private _browserService: BrowserService) {
    this._init();
  }
  
  ngOnDestroy() {
  
  }
  
  private _init(): void {
    this.leftDateRangeItems = this._dateFilterService.getDateRange('left');
    this.rightDateRangeItems = this._dateFilterService.getDateRange('right');
    this.selectedDateRange = this.lastSelectedDateRange = this._dateRange;
    setTimeout(() => {
      this.updateDataRanges(); // use a timeout to allow data binding to complete
    }, 0);
  }
  
  public updateDataRanges(): void {
    this.lastSelectedDateRange = this.selectedDateRange;
    if (this.selectedView === 'preset') {
      const dates = this._dateFilterService.getDateRangeDetails(this.selectedDateRange);
      this.startDate = dates.startDate;
      this.endDate = dates.endDate;
      this._dateRangeLabel = dates.label;
    } else {
      this.startDate = this.specificDateRange[0];
      this.endDate = this.specificDateRange[1];
      this._dateRangeLabel = DateFilterUtils.getMomentDate(this.startDate).format('MMM D, YYYY, HH:mm') + ' - ' + DateFilterUtils.getMomentDate(this.endDate).format('MMM D, YYYY, HH:mm');
    }
    
    this.triggerChangeEvent();
  }
  
  public openPopup(): void {
    this.selectedDateRange = this.lastSelectedDateRange;
  }
  
  private triggerChangeEvent(): void {
    this.filterChange.emit({
      startDate: moment(this.startDate).unix(),
      endDate: moment(this.endDate).unix(),
    });
  }
  
  public _timeChange(date: Date, type: 'from' | 'to') {
    console.warn(event);
  }
}
