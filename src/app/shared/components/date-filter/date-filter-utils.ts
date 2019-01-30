import * as moment from 'moment';

export class DateFilterUtils {

  static getTimeZoneOffset(): number {
    const today: Date = new Date();
    return today.getTimezoneOffset();
  }

  static toServerDate(value: Date): number {
    return value ? Math.round(value.getTime() / 1000) : null;
  }

  static fromServerDate(value: number): Date {
    return (value ? new Date(value * 1000) : null);
  }


  static getDay(value: Date): string {
    return value.getFullYear().toString() + DateFilterUtils.getFull(value.getMonth() + 1) + DateFilterUtils.getFull(value.getDate());
  }

  static getFull(num: number): string {
    return num > 9 ? num.toString() : ( '0' + num.toString());
  }

  static formatMonthString(value: string, locale: string): string {
    const year: string = value.substring(0, 4);
    const month: string = value.substring(4, 6);
    const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
    return date.toLocaleString(locale, { month: 'long' }) + ' ' + date.getFullYear();
  }

  static formatFullDateString(value: string, locale: string): string {
    const year: string = value.substring(0, 4);
    const month: string = value.substring(4, 6);
    const day: string = value.substring(6, 8);
    // const date: date = new Date( parseFloat(year) , parseFloat(month) - 1 , parseFloat(day) );
    return month + '/' + day + '/' + year;
  }
  
  static formatDayString(value: string, locale: string): string {
    const year: string = value.substring(0, 4);
    const month: string = value.substring(4, 6);
    const day: string = value.substring(6, 8);
    const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
    return `${date.toLocaleString(locale, { month: 'short' })} ${day}`;
  }

  static formatMonthOnlyString(value: string, locale: string): string {
    const year: string = value.substring(0, 4);
    const month: string = value.substring(4, 6);
    const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
    return date.toLocaleString(locale, { month: 'long' });
  }

  static formatShortDateString(value: string, locale: string): string {
    const year: string = value.substring(0, 4);
    const month: string = value.substring(4, 6);
    const day: string = value.substring(6, 8);
    return month + '/' + day;
  }

  static formatMonthDayString(value: string, locale: string): string {
    const year: string = value.substring(0, 4);
    const month: string = value.substring(4, 6);
    const day: string = value.substring(6, 8);
    const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
    return `${date.toLocaleString(locale, { month: 'short' })} ${day}, ${date.getFullYear()}`;
  }
  
  static parseDateString(value: string): moment.Moment {
    const day = Number(value.substring(6, 8));
    
    if (!day) {
      value += '01'; // add the first day of a month to correct parsing
    }
  
    return moment(value);
  }
}
