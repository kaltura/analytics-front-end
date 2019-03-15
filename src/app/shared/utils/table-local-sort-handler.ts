import { SortEvent } from 'primeng/api';

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
    
        if (typeof value1 === 'string' && typeof value2 === 'string') {
          value1 = value1.replace(new RegExp(',', 'g'), '');
          value2 = value2.replace(new RegExp(',', 'g'), '');
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
  
  const [month, year] = date.split(' ');
  const monthIndex = months.indexOf(month) + 1;
  if (monthIndex) {
    return new Date(`${monthIndex}/01/${year}`);
  }
  
  return new Date(date);
}
