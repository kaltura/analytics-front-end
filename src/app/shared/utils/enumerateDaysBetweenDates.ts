import * as moment from 'moment';

export function enumerateDaysBetweenDates(startDate: moment.Moment, endDate: moment.Moment): moment.Moment[] {
  const start = startDate.clone();
  const dates = [];
  
  while (start.isBefore(endDate)) {
    dates.push(start.clone());
    start.add(1, 'days');
  }
  return dates;
}
