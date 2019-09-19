import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DateChangeEvent, DateFilterQueryParams, DateFilterService, DateRanges, DateRangeType } from './date-filter.service';
import { DateFilterUtils } from './date-filter-utils';
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
  
  @Input() creationDate: moment.Moment = null;

  @Output() filterChange: EventEmitter<DateChangeEvent> = new EventEmitter();
  
  public _defaultDateRageType = DateRangeType.LongTerm;
  public _defaultDateRange = DateRanges.CurrentYear;
  public _dateRangeType = this._defaultDateRageType;
  public _dateRange = this._defaultDateRange;
  public _dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'mm/dd/yy' : 'dd/mm/yy';

  public lastDateRangeItems: SelectItem[] = [];
  public currDateRangeItems: SelectItem[] = [];
  public selectedDateRange: DateRanges;
  private lastSelectedDateRange: DateRanges; // used for revert selection

  public viewItems: SelectItem[] = [
    {label: this._translate.instant('app.dateFilter.preset'), value: 'preset'},
    {label: this._translate.instant('app.dateFilter.specific'), value: 'specific'},
  ];
  public selectedView = 'preset';
  public selectedComparePeriod = 'lastYear';

  public _dateRangeLabel = '';
  public specificDateRange: Date[] = [new Date(), new Date()];
  public compare = false;
  public specificCompareStartDate: Date = new Date();
  public compareMaxDate: Date;
  public comparing = false;

  private compareStartDate: Date;
  private compareEndDate: Date;

  private startDate: Date;
  private endDate: Date;
  
  private _queryParams: { [key: string]: string } = null;
  
  public get _applyDisabled(): boolean {
    return this.selectedView === 'specific' && this.specificDateRange.filter(Boolean).length !== 2;
  }

  constructor(private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _dateFilterService: DateFilterService,
              private _browserService: BrowserService) {
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
    this.lastDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'last', this.creationDate);
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
      this._dateRange = dateBy === DateRanges.SinceCreation && !this.creationDate ? DateRanges.Last30D : dateBy;
    } else if (params[DateFilterQueryParams.dateFrom] && params[DateFilterQueryParams.dateTo]) {
      const dateFrom = moment(params[DateFilterQueryParams.dateFrom]);
      const dateTo = moment(params[DateFilterQueryParams.dateTo]);
  
      if (dateFrom.isValid() && dateTo.isValid()) {
        this.selectedView = 'specific';
        this.specificDateRange = [dateFrom.toDate(), dateTo.toDate()];
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
            : this._dateFilterService.getMaxCompare(this._dateRange, this.creationDate);
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
      const dates = this._dateFilterService.getDateRangeDetails(this.selectedDateRange, this.creationDate);
      this.startDate = dates.startDate;
      this.endDate = dates.endDate;
      this._dateRangeLabel = dates.label;
    } else {
      this.startDate = this.specificDateRange[0];
      this.endDate = this.specificDateRange[1];
      this._dateRangeLabel = DateFilterUtils.getMomentDate(this.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this.endDate).format('MMM D, YYYY');
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
  }

  public updateCompareMax(): void {
    setTimeout(() => { // use a timeout to allow binded variables to update before calculations
      this.compareMaxDate = this.selectedView === 'specific'
        ? this._dateFilterService.getMaxCompare(this.specificDateRange[0], this.specificDateRange[1])
        : this._dateFilterService.getMaxCompare(this.selectedDateRange, this.creationDate);
    }, 0);
  }
  
  public updateSpecificCompareStartDate(): void {
    const maxCompareDate = this.selectedView === 'specific'
      ? this._dateFilterService.getMaxCompare(this.specificDateRange[0], this.specificDateRange[1])
      : this._dateFilterService.getMaxCompare(this._dateRange, this.creationDate);
    this.specificCompareStartDate = this.specificCompareStartDate > maxCompareDate ? maxCompareDate : this.specificCompareStartDate;
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

}
