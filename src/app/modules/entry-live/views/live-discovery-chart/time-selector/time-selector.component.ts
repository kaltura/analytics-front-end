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
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';

@Component({
  selector: 'app-time-selector',
  templateUrl: './time-selector.component.html',
  styleUrls: ['./time-selector.component.scss'],
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
              private _pageScrollService: PageScrollService,
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
  
    this._dateFilterService.popupOpened$
      .pipe(cancelOnDestroy(this))
      .subscribe(() => {
        this._popupOpened = true;
        this._scrollToPopup();
      });
  }
  
  private _scrollToPopup(): void {
    if (analyticsConfig.isHosted) {
      const targetEl = document.getElementById('discovery-time-selector') as HTMLElement;
      if (targetEl) {
        const position = targetEl.getBoundingClientRect().top + window.pageYOffset - 54;
        this._frameEventManager.publish(FrameEvents.ScrollTo, position);
      }
    } else {
      PageScrollConfig.defaultDuration = 500;
      const pageScrollInstance = PageScrollInstance.simpleInstance(document, '#discovery-time-selector');
      this._pageScrollService.start(pageScrollInstance);
    }
  }
  
  private _resetTime(): void {
    if (this._invalidTimes) {
      this._fromTime = moment().subtract(1, 'minute').toDate();
      this._toTime = new Date();
  
      this._validateTimeInputs();
    }
  }
  
  private _triggerChangeEvent(): void {
    const isPresetMode = this._selectedView === 'preset';
    const startDate = moment(this._startDate);
    const endDate = moment(this._endDate);
    const daysCount = !isPresetMode ? endDate.diff(startDate, 'days') + 1 : null;
    const payload = {
      isPresetMode,
      daysCount,
      startDate: startDate.unix(),
      endDate: endDate.unix(),
      dateRange: this._selectedDateRange,
      rangeLabel: this._dateRangeLabel,
    };
    this.filterChange.emit(payload);
    this._dateFilterService.onFilterChange(payload);
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
  
  private _formPresetDateRangeLabel(preset: DateRange, label: string, from: Date, to: Date): string {
    return `<b>${label}</b>&nbsp;&nbsp;&nbsp;${this._formatDateRangeLabel(from, to)}`;
  }
  
  private _formatDateRangeLabel(from: Date, to: Date): string {
    const startDate = DateFilterUtils.getMomentDate(from);
    const endDate = DateFilterUtils.getMomentDate(to);
    const getDate = date => date.format(analyticsConfig.dateFormat === 'month-day-year' ? 'MM/D/YYYY' : 'D/MM/YYYY');
    const getTime = date => date.format('HH:mm');
  
    return `${getDate(startDate)}, <b>${getTime(startDate)}</b> – ${getDate(endDate)}, <b>${getTime(endDate)}</b>`;
  }
  
  public _validateTimeInputs(): void {
    // postpone checks to make sure all properties are updated
    setTimeout(() => {
      this._timeChange('from');
      this._timeChange('to');
    }, 0);
  }
  
  public _updateDataRanges(): void {
    this._lastSelectedDateRange = this._selectedDateRange;
    if (this._selectedView === 'preset') {
      const dates = this._dateFilterService.getDateRangeDetails(this._selectedDateRange);
      this._startDate = dates.startDate;
      this._endDate = dates.endDate;
      this._dateRangeLabel = this._formPresetDateRangeLabel(this._selectedDateRange, dates.label, this._startDate, this._endDate);
    } else {
      this._startDate = this._getDate(this._specificDateRange[0], this._fromTime);
      this._endDate = this._getDate(this._specificDateRange[1], this._toTime);
      this._dateRangeLabel = this._formatDateRangeLabel(this._startDate, this._endDate);
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
    const isSameDay = moment(this._specificDateRange[0]).isSame(moment(this._specificDateRange[1]), 'day');

    this._invalidFrom = isFromTime && isSameDay && time.isSameOrAfter(moment(this._toTime).set({ second: 0 }));
    this._invalidTo = !isFromTime && isSameDay && time.isSameOrBefore(moment(this._fromTime).set({ second: 0 }));
  
    this._invalidTimes = this._invalidFrom || this._invalidTo;
  }
}
