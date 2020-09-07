import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DateChangeEvent, DateFilterQueryParams, DateFilterService, DateRangeType } from './date-filter.service';
import { DateFilterUtils, DateRanges } from './date-filter-utils';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import * as moment from 'moment';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';
import { filter } from 'rxjs/operators';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { isEmptyObject } from 'shared/utils/is-empty-object';
import { BrowserService } from 'shared/services';
import {DateRange} from "../../../modules/entry-live/views/live-discovery-chart/filters/filters.service";

@Component({
  selector: 'app-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent implements OnInit, OnDestroy {
  @Input() selectedTimeUnit = KalturaReportInterval.months;
  @Input() name = 'default';

  @Input() set dateRangeType(value: DateRangeType) {
    if (!isNaN(value)) {
      this._defaultDateRageType = value;
      this._dateRangeType = value;
    } else {
      this._dateRangeType = this._defaultDateRageType;
    }
  }
  @Input() set dateRange(value: DateRanges) {
    if (value) {
      this._defaultDateRange = value;
      this._dateRange = value;
    } else {
      this._dateRange = this._defaultDateRange;
    }
  }
  @Input() showCompare = true;

  @Input() set creationDate( value: moment.Moment) {
    if (value) {
      this._creationDate = value;
      this.sinceDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'since', this._creationDate, this._firstBroadcastDate, this._lastBroadcastDate);
    }
  }

  @Input() set firstBroadcastDate( value: moment.Moment) {
    if (value) {
      this._firstBroadcastDate = value;
      this.sinceDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'since', this._creationDate, this._firstBroadcastDate, this._lastBroadcastDate);
    }
  }

  @Input() set lastBroadcastDate( value: moment.Moment) {
    if (value) {
      this._lastBroadcastDate = value;
      this.sinceDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'since', this._creationDate, this._firstBroadcastDate, this._lastBroadcastDate);
    }
  }

  @Output() filterChange: EventEmitter<DateChangeEvent> = new EventEmitter();

  @ViewChild('datesBtn') set datesBtn(elRef: ElementRef) {
    if (elRef && elRef.nativeElement) {
      this._datesBtnElement = elRef.nativeElement;
    }
  }

  private _datesBtnElement: HTMLElement;
  public _creationDate: moment.Moment = null;
  private _firstBroadcastDate: moment.Moment = null;
  private _lastBroadcastDate: moment.Moment = null;

  public _defaultDateRageType = DateRangeType.LongTerm;
  public _defaultDateRange = DateRanges.CurrentYear;
  public _dateRangeType = this._defaultDateRageType;
  public _dateRange = this._defaultDateRange;
  public _dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'mm/dd/yy' : 'dd/mm/yy';

  public sinceDateRangeItems: SelectItem[] = [];
  public lastDateRangeItems: SelectItem[] = [];
  public currDateRangeItems: SelectItem[] = [];
  public selectedDateRange: DateRanges;
  public localeData = {};
  private lastSelectedDateRange: DateRanges; // used for revert selection

  public viewItems: SelectItem[] = [
    {label: this._translate.instant('app.dateFilter.preset'), value: 'preset'},
    {label: this._translate.instant('app.dateFilter.specific'), value: 'specific'},
  ];
  public selectedView = 'preset';
  public selectedComparePeriod = 'lastYear';

  public _dateRangePrefix = '';
  public _dateRangeLabel = '';
  public specificStart: Date = new Date();
  public specificEnd: Date = new Date();
  public specificDateRange: Date[] = [this.specificStart, this.specificEnd];
  public compare = false;
  public specificCompareStartDate: Date = new Date();
  public compareMaxDate: Date;
  public comparing = false;
  public validDateRange = true;

  private compareStartDate: Date;
  private compareEndDate: Date;

  private startDate: Date;
  private endDate: Date;

  private _queryParams: { [key: string]: string } = null;

  public get _applyDisabled(): boolean {
    return this.selectedView === 'specific' && this.specificDateRange.filter(Boolean).length !== 2 || !this.validDateRange;
  }

  constructor(private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _dateFilterService: DateFilterService,
              private _browserService: BrowserService,
              private _renderer: Renderer2) {
    this.localeData = DateFilterUtils.getLocalData(analyticsConfig.locale);
    let momentLocale = analyticsConfig.locale;
    momentLocale = momentLocale === "zh_hans" ? "zh-cn" : momentLocale === "zh_hant" ? "zh-tw" : momentLocale; // fix for Chinese locales
    moment.locale(momentLocale);
  }

  ngOnInit() {
    if (analyticsConfig.isHosted) {
      this._frameEventManager
        .listen(FrameEvents.UpdateFilters)
        .pipe(cancelOnDestroy(this), filter(Boolean))
        .subscribe(({ queryParams }) => {
          // query params are flat, so string compare is okay
          if (JSON.stringify(this._queryParams) !== JSON.stringify(queryParams) ) {
            this._init(queryParams);
            this._queryParams = queryParams;
          }
        });
    } else {
      const params = this._route.snapshot.queryParams;
      this._init(params);
    }
  }

  ngOnDestroy() {
  }

  private _init(queryParams: Params): void {
    const params = this._dateFilterService.currentFilters || queryParams;
    this._browserService.updateCurrentQueryParams(params);
    this._initCurrentFilterFromEventParams(params);
    this.sinceDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'since', this._creationDate, this._firstBroadcastDate, this._lastBroadcastDate);
    this.lastDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'last');
    this.currDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'current');
    this.selectedDateRange = this.lastSelectedDateRange = this._dateRange;
    setTimeout( () => {
      this.updateDataRanges(false); // use a timeout to allow data binding to complete
    }, 0);
  }

  private _initCurrentFilterFromEventParams(params: Params): void {
    if (isEmptyObject(params)) {
      this._dateRangeType = this._defaultDateRageType;
      this._dateRange = this._defaultDateRange;
      this.compare = false;
      return;
    }

    const dateBy = this._dateFilterService.getDateRangeByString(params[DateFilterQueryParams.dateBy]);
    if (dateBy) {
      this.selectedView = 'preset';
      this._dateRange = dateBy;
      if ((dateBy === DateRanges.SinceCreation && !this._creationDate) ||
          (dateBy === DateRanges.SinceLastBroadcast && !this._lastBroadcastDate) ||
          (dateBy === DateRanges.SinceFirstBroadcast && !this._firstBroadcastDate)) {
        this._dateRange = DateRanges.Last30D;
      }
    } else if (params[DateFilterQueryParams.dateFrom] && params[DateFilterQueryParams.dateTo]) {
      const dateFrom = moment(params[DateFilterQueryParams.dateFrom]);
      const dateTo = moment(params[DateFilterQueryParams.dateTo]);

      if (dateFrom.isValid() && dateTo.isValid()) {
        this.selectedView = 'specific';
        this.specificStart = dateFrom.toDate();
        this.specificEnd = dateTo.toDate();
        this.specificDateRange = [this.specificStart, this.specificEnd];
      }
    }

    const compareTo = params[DateFilterQueryParams.compareTo];
    if (compareTo) {
      this.compare = true;
      if (compareTo === 'lastYear') {
        this.selectedComparePeriod = 'lastYear';
      } else {
        const compareToDateObject = moment(compareTo);
        if (compareToDateObject.isValid()) {
          const compareToDate = compareToDateObject.toDate();
          const maxCompareDate = this.selectedView === 'specific'
            ? this._dateFilterService.getMaxCompare(this.specificDateRange[0], this.specificDateRange[1])
            : this._dateFilterService.getMaxCompare(this._dateRange, this._creationDate);
          this.selectedComparePeriod = 'specific';
          this.specificCompareStartDate = compareToDate > maxCompareDate ? maxCompareDate : compareToDate;
        } else {
          this.compare = false;
        }
      }
    }
  }

  private _getUpdatedRouteParams(): { [key: string]: string } {
    const updateParams = (params, payload) => {
      // manually add properties that need to be preserved to avoid preserving duplicating specific and preset date filters
      const preserveEntryId = params.hasOwnProperty('id') ? { id: params.id } : {};
      return { ...preserveEntryId, ...payload };
    };
    let queryParams = this._queryParams || {};
    if (this.selectedView === 'preset') {
      queryParams = updateParams(queryParams, { dateBy: this.selectedDateRange });
    } else if (this.selectedView === 'specific') {
      queryParams = updateParams(queryParams, {
        dateFrom: DateFilterUtils.getDay(this.startDate),
        dateTo: DateFilterUtils.getDay(this.endDate),
      });
    }

    if (queryParams && this.compare) {
      if (this.selectedComparePeriod === 'lastYear') {
        queryParams.compareTo = 'lastYear';
      } else if (this.selectedComparePeriod === 'specific') {
        queryParams.compareTo = DateFilterUtils.getDay(this.compareStartDate);
      }
    }

    return queryParams;
  }

  private _updateRouteParams(): void {
    const queryParams = this._getUpdatedRouteParams();
    this._browserService.updateCurrentQueryParams(queryParams);

    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.Navigate, queryParams);
    } else {
      this._router.navigate(['.'], { relativeTo: this._route, queryParams });
    }
  }

  public updateDataRanges(isUserAction = true): void {
    this.lastSelectedDateRange = this.selectedDateRange;
    if (this.selectedView === 'preset') {
      let customDate = null;
      switch (this.lastSelectedDateRange) {
        case DateRanges.SinceCreation:
          customDate = this._creationDate;
          break;
        case DateRanges.SinceLastBroadcast:
          customDate = this._lastBroadcastDate;
          break;
        case DateRanges.SinceFirstBroadcast:
          customDate = this._firstBroadcastDate;
          break;
      }
      const dates = this._dateFilterService.getDateRangeDetails(this.selectedDateRange, customDate);
      this.startDate = dates.startDate;
      this.endDate = dates.endDate;
      this._dateRangeLabel = dates.label;
      this._dateRangePrefix = this._translate.instant(DateFilterUtils.getDatesLabelPrefix(this.lastSelectedDateRange, null));
    } else {
      this.startDate = this.specificDateRange[0];
      this.endDate = this.specificDateRange[1];
      this._dateRangeLabel = DateFilterUtils.getMomentDate(this.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this.endDate).format('MMM D, YYYY');
      const diff = moment(this.endDate).diff(moment(this.startDate), 'days') + 1;
      this._dateRangePrefix = this._translate.instant(DateFilterUtils.getDatesLabelPrefix(null, {startDate: this.startDate, endDate: this.endDate}), {0: diff});
    }
    this.updateCompareMax();
    if (this.selectedComparePeriod === 'lastYear') {
      this.compareStartDate = DateFilterUtils.getMomentDate(this.startDate).subtract(12, 'months').toDate();
      this.compareEndDate = DateFilterUtils.getMomentDate(this.endDate).subtract(12, 'months').toDate();
    } else {
      this.compareStartDate = this.specificCompareStartDate;
      if (this.compareStartDate > this.compareMaxDate) {
        this.compareStartDate = this.compareMaxDate;
      }
      const diff = DateFilterUtils.getMomentDate(this.endDate).diff(DateFilterUtils.getMomentDate(this.startDate));
      this.compareEndDate = DateFilterUtils.getMomentDate(this.compareStartDate).add(diff).toDate();
    }
    this.comparing = this.compare;
    this.triggerChangeEvent();

    if (isUserAction) {
      this._dateFilterService.updateCurrentFilters(this._getUpdatedRouteParams());
    }
  }

  public timeUnitsChange(timeUnit: KalturaReportInterval, applyIn?: string): void {
    this.selectedTimeUnit = timeUnit;
    this.triggerChangeEvent(applyIn, 'timeUnits');
  }

  public openPopup(): void {
    this.selectedDateRange = this.lastSelectedDateRange;
  }

  public resetCompare(): void {
    this.selectedComparePeriod = 'lastYear';
    this.disableHiddenElementTabs();
  }

  public updateCompareMax(): void {
    setTimeout(() => { // use a timeout to allow binded variables to update before calculations
      this.compareMaxDate = this.selectedView === 'specific'
        ? this._dateFilterService.getMaxCompare(this.specificDateRange[0], this.specificDateRange[1])
        : this._dateFilterService.getMaxCompare(this.selectedDateRange, this._creationDate);
      this.specificStart = this.specificDateRange[0];
      this.specificEnd = this.specificDateRange[1];
      this.validate();
    }, 0);
  }

  public updateSpecificCompareStartDate(): void {
    const maxCompareDate = this.selectedView === 'specific'
      ? this._dateFilterService.getMaxCompare(this.specificDateRange[0], this.specificDateRange[1])
      : this._dateFilterService.getMaxCompare(this._dateRange, this._creationDate);
    this.specificCompareStartDate = this.specificCompareStartDate > maxCompareDate ? maxCompareDate : this.specificCompareStartDate;
    this.specificStart = this.specificDateRange[0];
    this.specificEnd = this.specificDateRange[1];
  }

  public updateSpecific(): void {
    this.validate();
    this.specificDateRange = [this.specificStart, this.specificEnd];
  }

  public exitCompare(): void {
    this.compare = false;
    this.updateDataRanges();
  }

  private triggerChangeEvent(applyIn?: string, changeOnly?: string): void {
    this.filterChange.emit({
      applyIn: applyIn,
      changeOnly: changeOnly,
      startDate: DateFilterUtils.toServerDate(this.startDate, true),
      endDate: DateFilterUtils.toServerDate(this.endDate, false),
      startDay: DateFilterUtils.getDay(this.startDate),
      endDay: DateFilterUtils.getDay(this.endDate),
      timeUnits: this.selectedTimeUnit,
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      compare: {
        active: this.compare,
        startDate: DateFilterUtils.toServerDate(this.compareStartDate, true),
        startDay: DateFilterUtils.getDay(this.compareStartDate),
        endDate: DateFilterUtils.toServerDate(this.compareEndDate, false),
        endDay: DateFilterUtils.getDay(this.compareEndDate)
      }
    });
    this._updateRouteParams();
  }

  public disableHiddenElementTabs(): void {
    // disable native checkboxes tab by setting it to -1
    setTimeout(() => {
      const checkboxes = document.getElementsByTagName('input');
      for (let i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].type === 'radio' || checkboxes[i].type === 'checkbox') {
          checkboxes[i].tabIndex = -1;
        }
      }
    }, 0);
  }

  public _focusSelectButton(): void {
    setTimeout(() => {
      this.disableHiddenElementTabs();
      // focus on the selected tab header
      try {
        const elm = document.getElementsByClassName('kDateFilterPopup')[0].getElementsByClassName('ui-selectbutton')[0].getElementsByClassName('ui-state-active')[0] as HTMLDivElement;
        if (elm) {
          elm.focus();
        }
      } catch (e) {}
    }, 0);
  }

  public triggerClick(selection): void {
    this.selectedDateRange = selection;
    this. updateCompareMax();
    this. resetCompare();
  }

  public setFocus(): void {
    setTimeout(() => {
      if (this._datesBtnElement) {
        this._renderer.setAttribute(this._datesBtnElement, 'tabindex', '0');
        this._datesBtnElement.focus();
      }
    }, 0);

  }

  private validate(): void {
    this.validDateRange = !this.specificEnd || DateFilterUtils.toServerDate(this.specificEnd, false) >= DateFilterUtils.toServerDate(this.specificStart, true); // validation
  }
}
