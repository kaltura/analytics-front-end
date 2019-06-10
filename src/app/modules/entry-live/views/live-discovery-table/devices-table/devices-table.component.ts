import { Component, Input } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { LiveDiscoverySummaryData } from '../live-discovery-table.widget';

@Component({
  selector: 'app-devices-table',
  templateUrl: './devices-table.component.html',
  styleUrls: ['./devices-table.component.scss']
})
export class DevicesTableComponent {
  @Input() tableData: TableRow[] = [];
  @Input() summary: LiveDiscoverySummaryData;
  @Input() columns: string[] = [];
  @Input() firstTimeLoading = true;

  public _onSortChanged(event: SortEvent): void {
    if (event.data.length && event.field && event.order) {
      event.data.sort((data1, data2) => {
        let value1 = String(parseFormattedValue(data1[event.field]));
        let value2 = String(parseFormattedValue(data2[event.field]));
        const result = value1.localeCompare(value2, undefined, { numeric: true });
        return (event.order * result);
      });
    }
  }
}
