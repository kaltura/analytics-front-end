import * as moment from 'moment';

export function enumerateMonthsBetweenDates(startDate: moment.Moment, endDate: moment.Moment): moment.Moment[] {
  const start = startDate.clone().startOf('month');
  const end = endDate.startOf('month');
  const dates = [];
  
  while (start.isBefore(end)) {
    dates.push(start.clone());
    start.add(1, 'months');
  }
  return dates;
}
