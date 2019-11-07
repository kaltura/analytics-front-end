import * as moment from 'moment';

export function getFixedEpoch(date: moment.Moment): number {
  return Math.floor(date.unix() / 10) * 10;
}
