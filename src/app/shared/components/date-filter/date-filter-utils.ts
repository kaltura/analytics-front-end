import * as moment from 'moment';
import { analyticsConfig } from 'configuration/analytics-config';

export enum DateRanges {
  Last7D = 'last7days',
  Last30D = 'last30days',
  Last3M = 'last3months',
  Last12M = 'last12months',
  CurrentWeek = 'currentWeek',
  CurrentMonth = 'currentMonth',
  CurrentQuarter = 'currentQuarter',
  CurrentYear = 'currentYear',
  PreviousMonth = 'previousMonth',
  SinceCreation = 'sinceCreation',
  SinceFirstBroadcast = 'sinceFirstBroadcast',
  SinceLastBroadcast = 'sinceLastBroadcast',
}

export class DateFilterUtils {
  static getTimeZoneOffset(): number {
    const today: Date = new Date();
    return today.getTimezoneOffset();
  }

  static toServerDate(value: Date, startDate: boolean): number {

    let dateClone = new Date(value.getTime());    // clone date to prevent changing the date passed by reference
    if (startDate) {
      const currentOffset = this.getTimeZoneOffset();
      const dateOffset = dateClone.getTimezoneOffset();
      const hoursDiff = (currentOffset - dateOffset) / 60;
      const updatedHours =  hoursDiff > 0 ? hoursDiff : 0;
      dateClone.setHours(updatedHours, 0, 0);     // force start of day
    } else {
      const currentOffset = this.getTimeZoneOffset();
      const dateOffset = dateClone.getTimezoneOffset();
      const hoursDiff = (currentOffset - dateOffset) / 60;
      const updatedHours =  hoursDiff < 0 ? 23 + hoursDiff : 23;
      dateClone.setHours(updatedHours, 59, 59);  // force end of day
    }
    return value ? Math.floor(dateClone.getTime() / 1000) : null; // divide by 1000 to convert to seconds as required by Kaltura API
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

  // March 2019
  static formatMonthString(value: string | number | Date, locale = analyticsConfig.locale): string {
    let result = '';
    locale = locale.length > 2 ? (locale === 'zn_hant' ? 'zf' : locale.substr(0, 2)) : locale;
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
      result = date.toLocaleString(locale, { month: 'long' }) + ' ' + date.getFullYear();
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = date.toLocaleString(locale, { month: 'long' }) + ' ' + date.getFullYear();
    } else if (value instanceof Date) {
      result = value.toLocaleString(locale, { month: 'long' }) + ' ' + value.getFullYear();
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }

    return result;
  }

  // 03/18/2019
  static formatFullDateString(value: string | number | Date): string {
    let result = '';
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const day: string = value.substring(6, 8);
      result = analyticsConfig.dateFormat === 'month-day-year'
        ? month + '/' + day + '/' + year
        : day + '/' + month + '/' + year;
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = analyticsConfig.dateFormat === 'month-day-year'
        ? this._getMonth(date) + '/' + this._getDate(date) + '/' + date.getFullYear()
        : this._getDate(date) + '/' + this._getMonth(date) + '/' + date.getFullYear();
    } else if (value instanceof Date) {
      result = analyticsConfig.dateFormat === 'month-day-year'
        ? this._getMonth(value) + '/' + this._getDate(value) + '/' + value.getFullYear()
        : this._getDate(value) + '/' + this._getMonth(value) + '/' + value.getFullYear();
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }

    return result;
  }

  // Mar 18
  static formatDayString(value: string | number | Date, locale = analyticsConfig.locale): string {
    let result = '';
    locale = locale.length > 2 ? (locale === 'zn_hant' ? 'zf' : locale.substr(0, 2)) : locale;
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const day: string = value.substring(6, 8);
      const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
      result = `${date.toLocaleString(locale, { month: 'short' })} ${day}`;
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = `${date.toLocaleString(locale, { month: 'short' })} ${this._getDate(date)}`;
    } else if (value instanceof Date) {
      result = `${value.toLocaleString(locale, { month: 'short' })} ${this._getDate(value)}`;
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }

    return result;
  }

  // March
  static formatMonthOnlyString(value: string | number | Date, locale = analyticsConfig.locale): string {
    let result = '';
    locale = locale.length > 2 ? (locale === 'zn_hant' ? 'zf' : locale.substr(0, 2)) : locale;
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
      result = date.toLocaleString(locale, { month: 'long' });
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = date.toLocaleString(locale, { month: 'long' });
    } else if (value instanceof Date) {
      result = value.toLocaleString(locale, { month: 'long' });
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }

    return result;
  }

  // 03/18
  static formatShortDateString(value: string | number | Date): string {
    let result = '';
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const day: string = value.substring(6, 8);
      result = analyticsConfig.dateFormat === 'month-day-year' ? month + '/' + day : day + '/' + month;
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = analyticsConfig.dateFormat === 'month-day-year'
        ? this._getMonth(date) + '/' + this._getDate(date)
        : this._getDate(date) + '/' + this._getMonth(date);
    } else if (value instanceof Date) {
      result = analyticsConfig.dateFormat === 'month-day-year'
        ? this._getMonth(value) + '/' + this._getDate(value)
        : this._getDate(value) + '/' + this._getMonth(value);
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }

    return result;
  }

  // Mar 18, 2019 or March 18, 2019
  static formatMonthDayString(value: string | number | Date, locale = analyticsConfig.locale, monthFormat = 'short'): string {
    let result = '';
    locale = locale.length > 2 ? (locale === 'zn_hant' ? 'zf' : locale.substr(0, 2)) : locale;
    if (typeof value === 'string') {
      const year: string = value.substring(0, 4);
      const month: string = value.substring(4, 6);
      const day: string = value.substring(6, 8);
      const date: Date = new Date( parseFloat(year) , parseFloat(month) , 0);
      result = `${date.toLocaleString(locale, { month: monthFormat })} ${day}, ${date.getFullYear()}`;
    } else if (typeof value === 'number') {
      const date = this.fromServerDate(value);
      result = `${date.toLocaleString(locale, { month: monthFormat })} ${this._getDate(date)}, ${date.getFullYear()}`;
    } else if (value instanceof Date) {
      result = `${value.toLocaleString(locale, { month: monthFormat })} ${this._getDate(value)}, ${value.getFullYear()}`;
    } else {
      throw new Error(`Unsupported value: ${value}`);
    }

    return result;
  }

  static getMomentDate(value: string | number | Date | moment.Moment): moment.Moment {
    let result = value;
    if (typeof value === 'number') {
      result = this._isUnixDate(value) ? this.fromServerDate(value) : new Date(value);
    }

    if (typeof value === 'string') {
      result = new Date(value);
    }
    return moment(result);
  }

  static parseDateString(value: string): moment.Moment {
    const day = value && value.length ? Number(value.substring(6, 8)) : null;

    if (!day) {
      value += '01'; // add the first day of a month to correct parsing
    }

    return moment(value, 'YYYYMMDD');
  }

  static getTimeStringFromEpoch(epoch: string, format = 'HH:mm:ss'): string {
    const date = moment.unix(Number(epoch));
    if (!date.isValid()) {
      return null;
    }

    return date.format(format);
  }

  private static _isUnixDate(number: number): boolean {
    return number.toString().length === 10;
  }

  private static _getMonth(date: Date): string {
    return ('0' + (date.getMonth() + 1)).slice(-2);
  }

  private static _getDate(date: Date): string {
    return ('0' + date.getDate()).slice(-2);
  }

  static getDatesLabelPrefix(preset: DateRanges, custom: {startDate: Date, endDate: Date}): string {
    let key = '';
    if (preset !== null) {
      switch (preset) {
        case DateRanges.CurrentMonth:
          key = 'app.dateFilter.prefix.month';
          break;
        case DateRanges.CurrentQuarter:
          key = 'app.dateFilter.prefix.quarter';
          break;
        case DateRanges.CurrentWeek:
          key = 'app.dateFilter.prefix.week';
          break;
        case DateRanges.CurrentYear:
          key = 'app.dateFilter.prefix.year';
          break;
        case DateRanges.Last3M:
          key = 'app.dateFilter.prefix.last3m';
          break;
        case DateRanges.Last7D:
          key = 'app.dateFilter.prefix.last7d';
          break;
        case DateRanges.Last12M:
          key = 'app.dateFilter.prefix.last12m';
          break;
        case DateRanges.Last30D:
          key = 'app.dateFilter.prefix.last30d';
          break;
        case DateRanges.SinceCreation:
          key = 'app.dateFilter.sinceCreation';
          break;
        case DateRanges.SinceFirstBroadcast:
          key = 'app.dateFilter.firstBroadcast';
          break;
        case DateRanges.SinceLastBroadcast:
          key = 'app.dateFilter.lastBroadcast';
          break;
      }
    } else {
      key = 'app.dateFilter.prefix.specific';
    }
    return key;
  }
  static getLocalData(locale: string): any {
    let localData = {
      firstDayOfWeek: 0,
      dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
      monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      today: 'Today',
      clear: 'Clear',
      dateFormat: 'mm/dd/yy',
      weekHeader: 'Wk'
    };
    switch (locale) {
      case "de" :
        localData.firstDayOfWeek = 1;
        localData.dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
        localData.dayNamesShort = ["Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam"];
        localData.dayNamesMin = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
        localData.monthNames = ["Januar", "Februar", "März",	"April", "Mai", "Juni",	"Juli",	"August",	"September", "Oktober", "November", "Dezember"];
        localData.monthNamesShort = ["Jan", "Feb",	"Mrz", "Apr",	"Mai", "Jun",	"Jul", "Aug",	"Sep", "Okt",	"Nov", "Dez"];
        localData.dateFormat = 'dd/mm/yy';
        break;
      case "nl" :
        localData.firstDayOfWeek = 1;
        localData.dayNames = ["zondag",	"maandag", "dinsdag",	"woensdag",	"donderdag", "vrijdag",	"zaterdag"];
        localData.dayNamesShort = ["zon.", "maa.", "din.", "woe.", "don.", "vrij.",	"zat."];
        localData.dayNamesMin = ["zo.", "ma.", "di.",	"wo.", "do.",	"vr.",  "za."];
        localData.monthNames = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
        localData.monthNamesShort = ["jan.", "feb.", "mrt.", "apr.", "mei.", "jun.", "jul.", "aug.", "sept.", "okt.", "nov.", "dec."];
        localData.dateFormat = 'dd/mm/yy';
        break;
      case "es" :
        localData.firstDayOfWeek = 1;
        localData.dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
        localData.dayNamesShort = ["do.", "lu.", "ma.", "mi.", "ju.", "vi.", "sá."];
        localData.dayNamesMin = ["D", "L", "M", "X",  "J",  "V", "S"];
        localData.monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        localData.monthNamesShort = ["en.", "febr.", "mzo.", "abr.", "my.", "jun.", "jul.", "ag.", "sept.", "oct.", "nov.", "dic."];
        localData.dateFormat = 'dd/mm/yy';
        break;
      case "fr" :
        localData.firstDayOfWeek = 1;
        localData.dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
        localData.dayNamesShort = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
        localData.dayNamesMin = ["D", "L", "M", "M", "J", "V", "S"];
        localData.monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
        localData.monthNamesShort = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];
        localData.dateFormat = 'dd/mm/yy';
        break;
      case "pt_br" :
        localData.firstDayOfWeek = 0;
        localData.dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        localData.dayNamesShort = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
        localData.dayNamesMin = ["D", "S", "T", "Q", "Q", "S", "S"];
        localData.monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        localData.monthNamesShort = ["JAN", "FEV", "MAR",  "ABR", "MAI", "JUN",  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        localData.dateFormat = 'dd/mm/yy';
        break;
      case "ru" :
        localData.firstDayOfWeek = 1;
        localData.dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
        localData.dayNamesShort = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
        localData.dayNamesMin = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
        localData.monthNames = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
        localData.monthNamesShort = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
        localData.dateFormat = 'dd/mm/yy';
        break;
      case "zh_hans" :
      case "zh_hant" :
        localData.firstDayOfWeek = 0;
        localData.dayNames = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        localData.dayNamesShort = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        localData.dayNamesMin = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        localData.monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
        localData.monthNamesShort = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
        localData.dateFormat = 'yy/mm/dd';
        break;
      case "ja" :
        localData.firstDayOfWeek = 0;
        localData.dayNames = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
        localData.dayNamesShort = ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"];
        localData.dayNamesMin = ["日", "月", "火", "水", "木", "金", "土"];
        localData.monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
        localData.monthNamesShort = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
        localData.dateFormat = 'yy/mm/dd';
        break;
    }
    return localData;
  }
}
