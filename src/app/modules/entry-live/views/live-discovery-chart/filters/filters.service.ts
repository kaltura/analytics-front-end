import { Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { KalturaReportInterval } from 'kaltura-ngx-client';

export enum TimeInterval {
  TenSeconds = 'TenSeconds',
  Minutes = 'Minutes',
  Hours = 'Hours',
  Days = 'Days',
}

export enum DateRange {
  LastMin = 'LastMinute',
  Last5M = 'Last5Minutes',
  Last30M = 'Last30Minutes',
  LastHour = 'LastHour',
  Last3H = 'Last3Hours',
  Last6H = 'Last6Hours',
  Last24H = 'Last24Hours',
  Last3D = 'Last3Days',
  Last7D = 'Last7Days'
}

export interface DateRangeServerValue {
  fromDate: number;
  toDate: number;
}

@Injectable()
export class FiltersService {
  constructor(private _translate: TranslateService) {
  }
  
  public getDateRangeServerValue(dateRange: DateRange): DateRangeServerValue {
    let from;
    
    switch (dateRange) {
      case DateRange.LastMin:
        from = moment().subtract(1, 'minute');
        break;
      case DateRange.Last5M:
        from = moment().subtract(5, 'minutes');
        break;
      case DateRange.Last30M:
        from = moment().subtract(30, 'minutes');
        break;
      case DateRange.LastHour:
        from = moment().subtract(1, 'hour');
        break;
      case DateRange.Last3H:
        from = moment().subtract(3, 'hours');
        break;
      case DateRange.Last6H:
        from = moment().subtract(6, 'hours');
        break;
      case DateRange.Last24H:
        from = moment().subtract(24, 'hours');
        break;
      case DateRange.Last3D:
        from = moment().subtract(3, 'days');
        break;
      case DateRange.Last7D:
        from = moment().subtract(7, 'days');
        break;
      default:
        from = moment().subtract(1, 'minute');
        break;
    }
    
    return {
      toDate: moment().unix(),
      fromDate: from.unix(),
    };
  }
  
  public getDateRangeList(): SelectItem[] {
    return [
      {
        value: DateRange.LastMin,
        label: this._translate.instant('app.entryLive.discovery.filter.lastMinute'),
      },
      {
        value: DateRange.Last5M,
        label: this._translate.instant('app.entryLive.discovery.filter.last5Minutes'),
      },
      {
        value: DateRange.Last30M,
        label: this._translate.instant('app.entryLive.discovery.filter.last30Minutes'),
      },
      {
        value: DateRange.LastHour,
        label: this._translate.instant('app.entryLive.discovery.filter.lastHour'),
      },
      {
        value: DateRange.Last3H,
        label: this._translate.instant('app.entryLive.discovery.filter.last3Hours'),
      },
      {
        value: DateRange.Last6H,
        label: this._translate.instant('app.entryLive.discovery.filter.last6Hours'),
      },
      {
        value: DateRange.Last24H,
        label: this._translate.instant('app.entryLive.discovery.filter.last24Hours'),
      },
      {
        value: DateRange.Last3D,
        label: this._translate.instant('app.entryLive.discovery.filter.last3Days'),
      },
      {
        value: DateRange.Last7D,
        label: this._translate.instant('app.entryLive.discovery.filter.last7Days'),
      },
    ];
  }

  public getTimeIntervalList(dateRange: DateRange): SelectItem[] {
    return [
      {
        value: TimeInterval.TenSeconds,
        label: this._translate.instant('app.entryLive.discovery.filter.10sec'),
        disabled: [DateRange.Last3D, DateRange.Last7D].indexOf(dateRange) !== -1,
      },
      {
        value: TimeInterval.Minutes,
        label: this._translate.instant('app.entryLive.discovery.filter.minutes'),
        disabled: DateRange.LastMin === dateRange,
      },
      {
        value: TimeInterval.Hours,
        label: this._translate.instant('app.entryLive.discovery.filter.hours'),
        disabled: [DateRange.LastMin, DateRange.Last5M, DateRange.Last30M, DateRange.LastHour].indexOf(dateRange) !== -1,
      },
      {
        value: TimeInterval.Days,
        label: this._translate.instant('app.entryLive.discovery.filter.days'),
        disabled: [DateRange.Last3D, DateRange.Last7D].indexOf(dateRange) === -1,
      },
    ];
  }
  
  public getTimeIntervalServerValue(interval: TimeInterval): KalturaReportInterval {
    switch (interval) {
      case TimeInterval.TenSeconds:
        return KalturaReportInterval.tenSeconds;
      case TimeInterval.Minutes:
        return KalturaReportInterval.minutes;
      case TimeInterval.Hours:
        return KalturaReportInterval.hours;
      case TimeInterval.Days:
        return KalturaReportInterval.days;
      default:
        return KalturaReportInterval.tenSeconds;
    }
  }
}
