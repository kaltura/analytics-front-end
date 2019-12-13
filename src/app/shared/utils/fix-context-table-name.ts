import { TableRow } from 'shared/utils/table-local-sort-handler';

export function fixContextTableName(item: TableRow): TableRow {
  if (!item['name']) {
    item['name'] = item['object_id'];
  }
  return item;
}
