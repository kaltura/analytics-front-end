import { Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from './date-filter-utils';
import { KalturaReportInterval } from 'kaltura-ngx-client';

export enum DateRanges {
  CurrentYear = 0,
  CurrentMonth = 1,
  CurrentPreviousMonth = 2,
  PreviousMonth = 3,
  CurrentQuarter = 4,
  CurrentPreviousQuarter = 5,
  PreviousQuarter = 6,
  CurrentPreviousYear = 7,
  PreviousYear = 8,
  Custom = 9
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
};

@Injectable()
export class DateFilterService {

  constructor(private _translate: TranslateService) {
  }

  public getDateRange(dateRangeType: DateRangeType): SelectItem[] {
    let selectItemArr: SelectItem[] = [];

    switch (dateRangeType) {
      case DateRangeType.LongTerm:
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.currYear'),
          value: DateRanges.CurrentYear
        });
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.currMonth'),
          value: DateRanges.CurrentMonth
        });
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.currPrevMonth'),
          value: DateRanges.CurrentPreviousMonth
        });
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.prevMonth'),
          value: DateRanges.PreviousMonth
        });
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.currQuarter'),
          value: DateRanges.CurrentQuarter
        });
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.currPrevQuarter'),
          value: DateRanges.CurrentPreviousQuarter
        });
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.prevQuarter'),
          value: DateRanges.PreviousQuarter
        });
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.currPrevYear'),
          value: DateRanges.CurrentPreviousYear
        });
        selectItemArr.push({
          label: this._translate.instant('app.dateFilter.prevYear'),
          value: DateRanges.PreviousYear
        });
        selectItemArr.push({label: this._translate.instant('app.dateFilter.custom'), value: DateRanges.Custom});
        break;
      case DateRangeType.ShortTerm:
        break;
      default:
        break;
    }

    return selectItemArr;
  }

  public getCalendars(selectedDateRange: DateRanges): { startDate: Date,  endDate: Date} {
    const today: Date = new Date();
    let startDate, endDate: Date;

    switch (selectedDateRange) {
      case DateRanges.CurrentYear:
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = today;
        break;
      case DateRanges.CurrentMonth:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
        break;
      case DateRanges.CurrentPreviousMonth:
        if (today.getMonth() === 0) {
          // wer'e in january, get last december
          startDate = new Date(today.getFullYear() - 1, 11, 1);
        } else {
          // first of last month
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        }
        endDate = today;
        break;
      case DateRanges.PreviousMonth:
        if (today.getMonth() === 0) {
          // wer'e in january, get last december
          startDate = new Date(today.getFullYear() - 1, 11, 1);
          endDate = new Date(today.getFullYear() - 1, 11, 31);
        } else {
          // first of last month
          startDate = new Date(today.getFullYear() - 1, today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear() - 1, today.getMonth() - 1, DateFilterUtils.getLastDayOfMonth(today.getMonth() - 1));
        }
        break;
      case DateRanges.CurrentQuarter:
        startDate = new Date(today.getFullYear(), DateFilterUtils.getFirstMonthOfQtr(today.getMonth()), 1);
        endDate = today;
        break;
      case DateRanges.CurrentPreviousQuarter:
        if (today.getMonth() < 3) {
          startDate = new Date(today.getFullYear() - 1, 9, 1); // 4th qtr of last year
        } else if (today.getMonth() < 6) {
          startDate = new Date(today.getFullYear(), 0, 1); // 1st qtr
        } else if (today.getMonth() < 9) {
          startDate = new Date(today.getFullYear(), 3, 1); // 2nd qtr
        } else {
          startDate = new Date(today.getFullYear(), 6, 1); // 3rd qtr
        }
        endDate = today;
        break;
      case DateRanges.PreviousQuarter:
        if (today.getMonth() < 3) {
          startDate = new Date(today.getFullYear() - 1, 9, 1); // (last) oct 1
          endDate = new Date(today.getFullYear() - 1, 11, 31); // (last) dec 31
        } else if (today.getMonth() < 6) {
          startDate = new Date(today.getFullYear(), 0, 1); // jan 1
          endDate = new Date(today.getFullYear(), 2, 31); // mar 31
        } else if (today.getMonth() < 9) {
          startDate = new Date(today.getFullYear(), 3, 1); // apr 1
          endDate = new Date(today.getFullYear(), 5, 30); // jun 30
        } else {
          startDate = new Date(today.getFullYear(), 6, 1); // jul 1
          endDate = new Date(today.getFullYear(), 8, 30); // sep 30
        }
        break;
      case DateRanges.CurrentPreviousYear:
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = today;
        break;
      case DateRanges.PreviousYear:
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
    }
    return { startDate, endDate};
  }

}

