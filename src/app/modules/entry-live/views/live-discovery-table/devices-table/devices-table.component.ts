import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { LiveDiscoverySummaryData, LiveDiscoveryTableWidget } from '../live-discovery-table.widget';
import { liveDiscoveryTablePageSize } from '../table-config';
import { DataTable } from 'primeng/primeng';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-devices-table',
  templateUrl: './devices-table.component.html',
  styleUrls: ['./devices-table.component.scss']
})
export class DevicesTableComponent implements OnDestroy {
  @Input() tableData: TableRow[] = [];
  @Input() summary: LiveDiscoverySummaryData;
  @Input() columns: string[] = [];
  @Input() firstTimeLoading = true;
  
  @ViewChild('table') _table: DataTable;
  
  public _pageSize = liveDiscoveryTablePageSize;
  
  constructor(private _widget: LiveDiscoveryTableWidget) {
    this._widget.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(() => {
        if (this._table) {
          this._table.reset();
        }
      });
  }
  
  ngOnDestroy(): void {
  }
  
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
