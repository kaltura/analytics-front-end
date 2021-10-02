import { SortEvent } from 'primeng/api';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { analyticsConfig } from 'configuration/analytics-config';

export type TableRow<T = any> = { [key: string]: T };

const dateKeys = ['month_id', 'date_id'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function tableLocalSortHandler(event: SortEvent, initialOrder: string = null, isCompareMode = false): string {
  if (event.data.length && event.field && event.order && !isCompareMode) {
    const order = event.order === 1 ? '+' + event.field : '-' + event.field;
    if (initialOrder !== order) {
      event.data.sort((data1, data2) => {
        let value1: any = data1[event.field];
        let value2: any = data2[event.field];
        let result = 0;

        if (dateKeys.indexOf(event.field) !== -1) {
          value1 = getDate(value1);
          value2 = getDate(value2);
        }
        if (event.field === 'hours_id'){
          result = value1.localeCompare(value2, undefined, { numeric: false });
        } else if (typeof value1 === 'string' && typeof value2 === 'string') {
          value1 = String(parseFormattedValue(value1));
          value2 = String(parseFormattedValue(value2));
          result = value1.localeCompare(value2, undefined, { numeric: true });
        } else {
          result = (value1 > value2) ? -1 : (value1 < value2) ? 1 : 0;
        }
        return (event.order * result);
      });
    }

    return order;
  }

  return initialOrder;
}

// parse date assuming there're 2 formats: 'MonthName Year' and 'MM/DD/YYYY'
// first one is not supported by IE
// create custom date from this format, otherwise fallback to standard approach
function getDate(date: string): Date {
  if (typeof date !== 'string') {
    return null;
  }

  let [month, year] = date.split(/\s+/);
  month = month.replace(/[^ -~]/g, ''); // because IE adds extra LTR and RTL characters ‎(ノ≥∇≤)ノ︵ ┻━┻
  const monthIndex = months.indexOf(month) + 1;
  if (monthIndex) {
    return new Date(`${('0' + monthIndex).slice(-2)}/01/${year}`);
  }

  return parseDate(date);
}

// add custom date factory to avoid invalid date issue with day-month-year date format
// since the default Date constructor accepts only month-day-year format
function parseDate(input: string): Date {
  const format = analyticsConfig.dateFormat === 'month-day-year' ? 'mm/dd/yyyy' : 'dd/mm/yyyy';
  const parts = input.match(/(\d+)/g).map(item => Number(item));
  const fmt: { [key: string]: number } = {};
  let i = 0;

  // extract date-part indexes from the format
  format.replace(/(yyyy|dd|mm)/g, part => (fmt[part] = i++, null));

  return new Date(parts[fmt['yyyy']], parts[fmt['mm']] - 1, parts[fmt['dd']]);
}
