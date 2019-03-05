import { SortEvent } from 'primeng/api';

export type TableRow<T = any> = { [key: string]: T };

const dateKeys = ['month_id', 'date_id'];

export function tableLocalSortHandler(event: SortEvent, initialOrder: string = null, isCompareMode = false): string {
  if (event.data.length && event.field && event.order && !isCompareMode) {
    const order = event.order === 1 ? '+' + event.field : '-' + event.field;
    if (initialOrder !== order) {
      event.data.sort((data1, data2) => {
        let value1: any = data1[event.field];
        let value2: any = data2[event.field];
        let result = 0;
    
        if (dateKeys.indexOf(event.field) !== -1) {
          value1 = new Date(value1);
          value2 = new Date(value2);
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
