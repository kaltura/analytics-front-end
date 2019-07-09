import { Injectable, OnDestroy } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { DateRange, FiltersService } from '../filters/filters.service';
import * as moment from 'moment';
import { Subject } from 'rxjs';

export interface DateChangeEvent {
  isPresetMode: boolean;
  startDate: number;
  endDate: number;
  dateRange: DateRange;
  daysCount: number;
  rangeLabel: string;
}

@Injectable()
export class TimeSelectorService implements OnDestroy {
  private _popupOpened = new Subject();
  
  public readonly popupOpened$ = this._popupOpened.asObservable();
  
  constructor(private _translate: TranslateService,
              private _filterService: FiltersService) {
  }
  
  ngOnDestroy(): void {
    this._popupOpened.complete();
  }
  
  public openPopup(): void {
    this._popupOpened.next();
  }
  
  public getDateRange(type: 'left' | 'right'): SelectItem[] {
    let selectItemArr: SelectItem[] = [];

    if (type === 'left') {
      selectItemArr = [
        {
          value: DateRange.LastMin,
          label: this._translate.instant('app.entryLive.discovery.filter.minute'),
        },
        {
          value: DateRange.Last5M,
          label: this._translate.instant('app.entryLive.discovery.filter.5Minutes'),
        },
        {
          value: DateRange.Last30M,
          label: this._translate.instant('app.entryLive.discovery.filter.30Minutes'),
        },
        {
          value: DateRange.LastHour,
          label: this._translate.instant('app.entryLive.discovery.filter.hour'),
        },
        {
          value: DateRange.Last3H,
          label: this._translate.instant('app.entryLive.discovery.filter.3Hours'),
        },
      ];
    } else if (type === 'right') {
      selectItemArr = [
        {
          value: DateRange.Last6H,
          label: this._translate.instant('app.entryLive.discovery.filter.6Hours'),
        },
        {
          value: DateRange.Last24H,
          label: this._translate.instant('app.entryLive.discovery.filter.24Hours'),
        },
        {
          value: DateRange.Last3D,
          label: this._translate.instant('app.entryLive.discovery.filter.3Days'),
        },
        {
          value: DateRange.Last7D,
          label: this._translate.instant('app.entryLive.discovery.filter.7Days'),
        },
      ];
    }
    
    return selectItemArr;
  }
  
  public getDateRangeDetails(selectedDateRange: DateRange): { startDate: Date, endDate: Date, label: string } {
    const { fromDate, toDate } = this._filterService.getDateRangeServerValue(selectedDateRange);
    const label = this._filterService.getDateRangeList().find(({ value }) => value === selectedDateRange).label;
    
    return { startDate: moment.unix(fromDate).toDate(), endDate: moment.unix(toDate).toDate(), label };
  }
}

