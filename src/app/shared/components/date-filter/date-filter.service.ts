import { Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import * as moment from 'moment';

export enum DateRanges {
  Last7D = 'last7days',
  Last30D = 'last30days',
  Last3M = 'last3months',
  Last12M = 'last12months',
  CurrentWeek = 'currentWeek',
  CurrentMonth = 'currentMonth',
  CurrentQuarter = 'currentQuarter',
  CurrentYear = 'currentYear',
  PreviousMonth = 'previousMonth'
}

export enum DateFilterQueryParams {
  dateBy = 'dateBy',
  dateFrom = 'dateFrom',
  dateTo = 'dateTo',
  compareTo = 'compareTo',
}

export enum DateRangeType {
  LongTerm = 0,
  ShortTerm = 1
}

export type DateChangeEvent = {
  startDate: number;
  endDate: number;
  startDay: string;
  endDay: string;
  timeUnits: KalturaReportInterval;
  timeZoneOffset: number;
  compare: {
    active: boolean;
    startDate: number;
    startDay: string;
    endDate: number;
    endDay: string;
  };
};

@Injectable()
export class DateFilterService {

  constructor(private _translate: TranslateService) {
  }
  
  public getDateRangeByString(value: string): DateRanges {
    switch (value) {
      case 'last7days':
        return DateRanges.Last7D;
      case 'last30days':
        return DateRanges.Last30D;
      case 'last3months':
        return DateRanges.Last3M;
      case 'last12months':
        return DateRanges.Last12M;
      case 'currentWeek':
        return DateRanges.CurrentWeek;
      case 'currentMonth':
        return DateRanges.CurrentMonth;
      case 'currentQuarter':
        return DateRanges.CurrentQuarter;
      case 'currentYear':
        return DateRanges.CurrentYear;
      case 'previousMonth':
        return DateRanges.PreviousMonth;
      default:
        return null;
    }
  }
  

  public getDateRange(dateRangeType: DateRangeType, period: string): SelectItem[] {
    let selectItemArr: SelectItem[] = [];

    switch (dateRangeType) {
      case DateRangeType.LongTerm:
        if (period === 'last') {
          selectItemArr.push({
            label: this._translate.instant('app.dateFilter.last7d'),
            value: {val: DateRanges.Last7D, tooltip: this.getDateRangeDetails(DateRanges.Last7D).label}
          });
          selectItemArr.push({
            label: this._translate.instant('app.dateFilter.last30d'),
            value: {val: DateRanges.Last30D, tooltip: this.getDateRangeDetails(DateRanges.Last30D).label}
          });
          selectItemArr.push({
            label: this._translate.instant('app.dateFilter.last3m'),
            value: {val: DateRanges.Last3M, tooltip: this.getDateRangeDetails(DateRanges.Last3M).label}
            });
          selectItemArr.push({
            label: this._translate.instant('app.dateFilter.last12m'),
            value: {val: DateRanges.Last12M, tooltip: this.getDateRangeDetails(DateRanges.Last12M).label}
            });
        }
        if (period === 'current') {
          selectItemArr.push({
            label: this._translate.instant('app.dateFilter.week'),
            value: {val: DateRanges.CurrentWeek, tooltip: this.getDateRangeDetails(DateRanges.CurrentWeek).label}
            });
          selectItemArr.push({
            label: this._translate.instant('app.dateFilter.month'),
            value: {val: DateRanges.CurrentMonth, tooltip: this.getDateRangeDetails(DateRanges.CurrentMonth).label}
            });
          selectItemArr.push({
            label: this._translate.instant('app.dateFilter.quarter'),
            value: {val: DateRanges.CurrentQuarter, tooltip: this.getDateRangeDetails(DateRanges.CurrentQuarter).label}
            });
          selectItemArr.push({
            label: this._translate.instant('app.dateFilter.year'),
            value: {val: DateRanges.CurrentYear, tooltip: this.getDateRangeDetails(DateRanges.CurrentYear).label}
            });
        }
        break;
      case DateRangeType.ShortTerm:
        break;
      default:
        break;
    }

    return selectItemArr;
  }

  public getDateRangeDetails(selectedDateRange: DateRanges): { startDate: Date,  endDate: Date, label: string} {
    const today: Date = new Date();
    const m = moment();
    let startDate, endDate: Date;

    switch (selectedDateRange) {
      case DateRanges.Last7D:
        startDate = m.subtract(7, 'days').toDate();
        endDate = today;
        break;
      case DateRanges.Last30D:
        startDate = m.subtract(30, 'days').toDate();
        endDate = today;
        break;
      case DateRanges.Last3M:
        startDate = m.subtract(3, 'months').toDate();
        endDate = today;
        break;
      case DateRanges.Last12M:
        startDate = m.subtract(12, 'months').toDate();
        endDate = today;
        break;
      case DateRanges.CurrentWeek:
        startDate = m.startOf('week').toDate();
        endDate = today;
        break;
      case DateRanges.CurrentMonth:
        startDate = m.startOf('month').toDate();
        endDate = today;
        break;
      case DateRanges.CurrentQuarter:
        startDate = m.startOf('quarter').toDate();
        endDate = today;
        break;
      case DateRanges.CurrentYear:
        startDate = m.startOf('year').toDate();
        endDate = today;
        break;
    }
    const label = moment(startDate).format('MMM D, YYYY') + ' - ' + moment(endDate).format('MMM D, YYYY');
    return { startDate, endDate, label};
  }

  public getMaxCompare(startDate: Date, endDate: Date): Date;
  public getMaxCompare(selectedDateRange: DateRanges): Date;
  public getMaxCompare(selectedDateRange: DateRanges | Date, endDate?: Date): Date {
    const m = moment();
    let maxDate: Date;

    if (selectedDateRange instanceof Date && endDate instanceof Date) {
      const fromDay = moment(selectedDateRange);
      const toDay = moment(endDate);
      const days = moment.duration(toDay.diff(fromDay)).asDays();
      maxDate = fromDay.clone().subtract(days + 1, 'days').toDate();
    } else {
      switch (selectedDateRange) {
        case DateRanges.Last7D:
        case DateRanges.CurrentWeek:
          maxDate = m.subtract(7, 'days').toDate();
          break;
        case DateRanges.Last30D:
        case DateRanges.CurrentMonth:
          maxDate = m.subtract(30, 'days').toDate();
          break;
        case DateRanges.Last3M:
        case DateRanges.CurrentQuarter:
          maxDate = m.subtract(3, 'months').toDate();
          break;
        case DateRanges.Last12M:
        case DateRanges.CurrentYear:
          maxDate = m.subtract(12, 'months').toDate();
          break;
      }
    }
    return maxDate;
  }

}

