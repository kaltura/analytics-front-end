import { SortEvent } from 'primeng/api';

export type TableRow = { [key: string]: string };

const dateKeys = ['month_id', 'date_id'];

export function getTableLocalSortHandler(event: SortEvent): (data1: TableRow, data2: TableRow) => number {
  return (data1, data2) => {
    let value1: any = data1[event.field];
    let value2: any = data2[event.field];
    let result = 0;
    
    if (dateKeys.indexOf(event.field) !== -1) {
      value1 = new Date(value1);
      value2 = new Date(value2);
    }
    
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      result = value1.localeCompare(value2, undefined, { numeric: true });
    } else {
      result = (value1 > value2) ? -1 : (value1 < value2) ? 1 : 0;
    }
    return (event.order * result);
  };
}
