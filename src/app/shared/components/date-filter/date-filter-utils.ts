export class DateFilterUtils {

  static getLastDayOfMonth(monthIndex: number): number {
    let res: number;
    switch (monthIndex) {
      case 0: // jan
      case 2: // mar
      case 4: // may
      case 6: // jul
      case 7: // aug
      case 9: // oct
      case 11: // dec
        res = 31;
        break;
      case 1: // feb
        res = 28;
        break;
      case 3: // apr
      case 5: // jun
      case 8: // sep
      case 10: // nov
        res = 30;
        break;
      default:
        res = -1;
    }
    return res;
  }

  static getFirstMonthOfQtr(monthIndex: number): number {
    let qtr: number;
    if (monthIndex < 3) {
      qtr = 0; // 1st qtr
    } else if (monthIndex < 6) {
      qtr = 3; // 2nd qtr
    } else if (monthIndex < 9) {
      qtr = 6; // 3rd qtr
    } else {
      qtr = 9; // 4th qtr
    }
    return qtr;
  }

  static getTimeZoneOffset(): number {
    const today: Date = new Date();
    return today.getTimezoneOffset();
  }

  static toServerDate(value: Date): number {
    return value ? Math.round(value.getTime() / 1000) : null;
  }

  static getDay(value: Date): string {
    return value.getFullYear().toString() + DateFilterUtils.getFull(value.getMonth() + 1) + DateFilterUtils.getFull(value.getDate());
  }

  static getFull(num: number): string {
    return num > 9 ? num.toString() : ( '0' + num.toString());
  }
}
