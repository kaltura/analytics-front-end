import * as moment from 'moment';

export function enumerateMonthsBetweenDates(startDate: moment.Moment, endDate: moment.Moment) {
  const now = startDate.clone().startOf('month');
  const end = endDate.startOf('month');
  const dates = [];
  
  while (now.isSameOrBefore(end)) {
    dates.push(now.clone());
    now.add(1, 'months');
  }
  return dates;
}
