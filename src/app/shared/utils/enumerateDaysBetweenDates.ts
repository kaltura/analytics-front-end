import * as moment from 'moment';

export function enumerateDaysBetweenDates(startDate: moment.Moment, endDate: moment.Moment) {
  const dates = [];
  let now = startDate.clone();
  
  while (now.isSameOrBefore(endDate)) {
    dates.push(now.clone());
    now.add(1, 'days');
  }
  return dates;
}
