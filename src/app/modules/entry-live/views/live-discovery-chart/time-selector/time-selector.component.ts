import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DateChangeEvent, TimeSelectorService } from './time-selector.service';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateRange } from '../filters/filters.service';
import * as moment from 'moment';
import { analyticsConfig } from 'configuration/analytics-config';

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
      this._selectedDateRange = value;
    } else {
      this._selectedDateRange = DateRange.LastMin;
    }
  }
  
  @Input() showCompare = true;
  
  @Output() filterChange: EventEmitter<DateChangeEvent> = new EventEmitter();
  
  private _lastSelectedDateRange: DateRange; // used for revert selection
  private _startDate: Date;
  private _endDate: Date;
  private _invalidTimes = false;
  
  public _invalidFrom = false;
  public _invalidTo = false;
  public _maxDate = new Date();
  public _minDate = moment().subtract(6, 'days').toDate();
  public _fromTime = moment().subtract(1, 'minute').toDate();
  public _toTime = new Date();
  public _popupOpened = false;
  public _leftDateRangeItems: SelectItem[] = [];
  public _rightDateRangeItems: SelectItem[] = [];
  public _selectedDateRange = DateRange.LastMin;
  public _viewItems: SelectItem[] = [
    { label: this._translate.instant('app.dateFilter.preset'), value: 'preset' },
    { label: this._translate.instant('app.dateFilter.specific'), value: 'specific' },
  ];
  public _selectedView = 'preset';
  public _dateRangeLabel = '';
  public _specificDateRange: Date[] = [new Date(), new Date()];
  
  public get _applyDisabled(): boolean {
    return this._selectedView === 'specific' && (this._specificDateRange.filter(Boolean).length !== 2 || this._invalidTimes);
  }
  
  constructor(private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _dateFilterService: TimeSelectorService) {
    this._init();
  }
  
  ngOnDestroy() {
  
  }
  
  private _init(): void {
    this._leftDateRangeItems = this._dateFilterService.getDateRange('left');
    this._rightDateRangeItems = this._dateFilterService.getDateRange('right');
    setTimeout(() => {
      this._updateDataRanges(); // use a timeout to allow data binding to complete
    }, 0);
  }
  
  private _resetTime(): void {
    if (this._invalidTimes) {
      this._fromTime = moment().subtract(1, 'minute').toDate();
      this._toTime = new Date();
      
      this._timeChange('from');
      this._timeChange('to');
    }
  }
  
  private _triggerChangeEvent(): void {
    this.filterChange.emit({
      isPresetMode: this._selectedView === 'preset',
      startDate: moment(this._startDate).unix(),
      endDate: moment(this._endDate).unix(),
      dateRange: this._selectedDateRange,
    });
  }
  
  private updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
      }, 0);
    }
  }
  
  private _getDate(date: Date, time: Date): Date {
    const momentDate = moment(date);
    const momentTime = moment(time);
    
    momentDate.set({ hour: momentTime.hour(), minute: momentTime.minute(), second: 0 });
    
    return momentDate.toDate();
  }
  
  public _updateDataRanges(): void {
    this._lastSelectedDateRange = this._selectedDateRange;
    if (this._selectedView === 'preset') {
      const dates = this._dateFilterService.getDateRangeDetails(this._selectedDateRange);
      this._startDate = dates.startDate;
      this._endDate = dates.endDate;
      this._dateRangeLabel = dates.label;
    } else {
      this._startDate = this._getDate(this._specificDateRange[0], this._fromTime);
      this._endDate = this._getDate(this._specificDateRange[1], this._toTime);
      this._dateRangeLabel = DateFilterUtils.getMomentDate(this._startDate).format('MMM D, YYYY, HH:mm') + ' - ' + DateFilterUtils.getMomentDate(this._endDate).format('MMM D, YYYY, HH:mm');
    }
    
    this._triggerChangeEvent();
  }
  
  public _togglePopup(): void {
    this._popupOpened = !this._popupOpened;
    this.updateLayout();
    
    if (this._popupOpened) {
      this._selectedDateRange = this._lastSelectedDateRange;
    } else {
      this._resetTime();
    }
  }
  
  public _closePopup(): void {
    this._popupOpened = false;
    this._resetTime();
  }
  
  public _timeChange(type: 'from' | 'to'): void {
    const isFromTime = type === 'from';
    const time = moment(isFromTime ? this._fromTime : this._toTime).set({ second: 0 });
    
    this._invalidFrom = isFromTime && time.isSameOrAfter(moment(this._toTime).set({ second: 0 }));
    this._invalidTo = !isFromTime && time.isSameOrBefore(moment(this._fromTime).set({ second: 0 }));
  
    this._invalidTimes = this._invalidFrom || this._invalidTo;
  }
}
