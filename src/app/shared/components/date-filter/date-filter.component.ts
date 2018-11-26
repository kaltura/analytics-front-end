import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DateChangeEvent, DateFilterQueryParams, DateFilterService, DateRanges, DateRangeType } from './date-filter.service';
import { DateFilterUtils } from './date-filter-utils';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import * as moment from 'moment';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';
import { filter } from 'rxjs/operators';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-date-filter',
  templateUrl: './date-filter.component.html',
  styleUrls: ['./date-filter.component.scss']
})
export class DateFilterComponent implements OnInit, OnDestroy {

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

  @Output() filterChange: EventEmitter<DateChangeEvent> = new EventEmitter();
  
  public _defaultDateRageType = DateRangeType.LongTerm;
  public _defaultDateRange = DateRanges.CurrentYear;
  public _dateRangeType = this._defaultDateRageType;
  public _dateRange = this._defaultDateRange;

  public lastDateRangeItems: SelectItem[] = [];
  public currDateRangeItems: SelectItem[] = [];
  public selectedDateRange: DateRanges;
  private lastSelectedDateRange: DateRanges; // used for revert selection

  public selectedTimeUnit: KalturaReportInterval = KalturaReportInterval.months;

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
  
  public get _applyDisabled(): boolean {
    return this.selectedView === 'specific' && this.specificDateRange.filter(Boolean).length !== 2;
  }

  constructor(private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService,
              private _route: ActivatedRoute,
              private _router: Router,
              private _dateFilterService: DateFilterService) {
  }

  ngOnInit() {
    if (analyticsConfig.isHosted) {
      this._frameEventManager
        .listen(FrameEvents.UpdateFilters)
        .pipe(cancelOnDestroy(this), filter(Boolean))
        .subscribe(({ queryParams }) => {
          this._init(queryParams);
        });
    } else {
      const params = this._route.snapshot.queryParams;
      this._init(params);
    }
    
    
  }
  
  ngOnDestroy() {
  
  }

  private _isEmptyObject(value: any): boolean {
    return (value && !Object.keys(value).length);
  }
  
  private _init(queryParams: Params): void {
    this._initCurrentFilterFromEventParams(queryParams);
    this.lastDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'last');
    this.currDateRangeItems = this._dateFilterService.getDateRange(this._dateRangeType, 'current');
    this.selectedDateRange = this.lastSelectedDateRange = this._dateRange;
    setTimeout( () => {
      this.updateDataRanges(); // use a timeout to allow data binding to complete
    }, 0);
  }
  
  private _initCurrentFilterFromEventParams(params: Params): void {
    if (this._isEmptyObject(params)) {
      this._dateRangeType = this._defaultDateRageType;
      this._dateRange = this._defaultDateRange;
      this.compare = false;
      return;
    }
  
    const dateBy = this._dateFilterService.getDateRangeByString(params[DateFilterQueryParams.dateBy]);
    if (dateBy) {
      this.selectedView = 'preset';
      this._dateRange = dateBy;
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
          const maxCompareDate = this._dateFilterService.getMaxCompare(this._dateRange);
          this.selectedComparePeriod = 'specific';
          this.specificCompareStartDate = compareToDate > maxCompareDate ? maxCompareDate : compareToDate;
        } else {
          this.compare = false;
        }
      }
    }
  }
  
  private _updateRouteParams(): void {
    let queryParams = null;
    if (this.selectedView === 'preset') {
      queryParams = { dateBy: this.selectedDateRange };
    } else if (this.selectedView === 'specific') {
      queryParams = {
        dateFrom: DateFilterUtils.getDay(this.startDate),
        dateTo: DateFilterUtils.getDay(this.endDate),
      };
    }
    
    if (queryParams && this.compare) {
      if (this.selectedComparePeriod === 'lastYear') {
        queryParams.compareTo = 'lastYear';
      } else if (this.selectedComparePeriod === 'specific') {
        queryParams.compareTo = DateFilterUtils.getDay(this.compareStartDate);
      }
    }
  
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.Navigate, queryParams);
    } else {
      this._router.navigate(['.'], { relativeTo: this._route, queryParams });
    }
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
      this._dateRangeLabel = moment(this.startDate).format('MMM D, YYYY') + ' - ' + moment(this.endDate).format('MMM D, YYYY');
    }
    this.updateCompareMax();
    if (this.selectedComparePeriod === 'lastYear') {
      this.compareStartDate = moment(this.startDate).subtract(12, 'months').toDate();
      this.compareEndDate = moment(this.endDate).subtract(12, 'months').toDate();
    } else {
      this.compareStartDate = this.specificCompareStartDate;
      if (this.compareStartDate > this.compareMaxDate) {
        this.compareStartDate = this.compareMaxDate;
      }
      const diff = moment(this.endDate).diff(moment(this.startDate));
      this.compareEndDate = moment(this.compareStartDate).add(diff).toDate();
    }
    this.comparing = this.compare;
    this.triggerChangeEvent();
  }

  public timeUnitsChange(timeUnit: KalturaReportInterval): void {
    this.selectedTimeUnit = timeUnit;
    this.triggerChangeEvent();
  }

  public openPopup(): void {
    this.selectedDateRange = this.lastSelectedDateRange;
  }

  public updateCompareMax(): void {
    setTimeout(() => { // use a timeout to allow binded variables to update before calculations
      this.compareMaxDate = this._dateFilterService.getMaxCompare(this.selectedDateRange);
    }, 0);
  }

  public exitCompare(): void {
    this.compare = false;
    this.updateDataRanges();
  }

  private triggerChangeEvent(): void {
    this.filterChange.emit({
      startDate: DateFilterUtils.toServerDate(this.startDate),
      endDate: DateFilterUtils.toServerDate(this.endDate),
      startDay: DateFilterUtils.getDay(this.startDate),
      endDay: DateFilterUtils.getDay(this.endDate),
      timeUnits: this.selectedTimeUnit,
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      compare: {
        active: this.compare,
        startDate: DateFilterUtils.toServerDate(this.compareStartDate),
        startDay: DateFilterUtils.getDay(this.compareStartDate),
        endDate: DateFilterUtils.toServerDate(this.compareEndDate),
        endDay: DateFilterUtils.getDay(this.compareEndDate)
      }
    });
    this._updateRouteParams();
  }

}
