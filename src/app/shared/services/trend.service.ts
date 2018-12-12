import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { ReportHelper } from 'shared/services/report-helper';

@Injectable()
export class TrendService {
  private _getTrendDirection(trend: number): number {
    return trend > 0 ? 1 : trend < 0 ? -1 : 0;
  }
  
  public getTooltipRowString(time, value, units = '') {
    return `<span class="kTotalsCompareTooltip">${time}<span class="kTotalsCompareTooltipValue"><strong>${value}</strong>&nbsp;${units}</span></span>`;
  }

  public getCompareDates(from: string | Date, to: string | Date): any {
    const fromDay = moment(from);
    const toDay = moment(to);
    const days = moment.duration(toDay.diff(fromDay)).asDays();
    const startDate = fromDay.clone().subtract(days + 1, 'days').toDate();
    const endDate = fromDay.clone().subtract(1, 'days').toDate();
  
    return {
      startDate: DateFilterUtils.toServerDate(startDate),
      endDate: DateFilterUtils.toServerDate(endDate),
      startDay: DateFilterUtils.getDay(startDate),
      endDay: DateFilterUtils.getDay(endDate),
    };
  }
  
  public calculateTrend(current: number, compare: number): { value: string, direction: number } {
    current = parseFloat(current.toFixed(2));
    compare = parseFloat(compare.toFixed(2));
    if (current === 0 && compare === 0) {
      return { value: '0', direction: 0 };
    }
    
    if (current === 0 && compare > 0) {
      return { value: '100', direction: -1 };
    }

    if (compare === 0 && current > 0) {
      return { value: null, direction: 0 };
    }

    const value = Math.ceil(((current - compare) / compare) * 100);
    const direction = this._getTrendDirection(value);
    return { value: ReportHelper.numberOrZero(String(Math.abs(value))), direction };
  }
}
