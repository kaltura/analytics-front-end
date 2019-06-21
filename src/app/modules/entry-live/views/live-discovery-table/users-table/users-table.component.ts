import { Component, Input, OnInit } from '@angular/core';
import { SortEvent } from 'primeng/api';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { LiveDiscoverySummaryData, LiveDiscoveryTableWidget } from '../live-discovery-table.widget';
import { liveDiscoveryTablePageSize } from '../table-config';

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html',
  styleUrls: ['./users-table.component.scss']
})
export class UsersTableComponent {
  @Input() tableData: TableRow[] = [];
  @Input() summary: LiveDiscoverySummaryData;
  @Input() columns: string[] = [];
  @Input() totalCount = 0;
  @Input() firstTimeLoading = true;
  
  private _initialSortEvent = true;
  
  public _order = '-avg_view_buffering';
  public _pager = new KalturaFilterPager({ pageSize: liveDiscoveryTablePageSize, pageIndex: 1 });
  
  constructor(public _widget: LiveDiscoveryTableWidget) {
  }
  
  public _onPaginationChange(event: { page: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._widget.paginationChange(this._pager);
    }
  }
  
  public _onSortChanged(event: SortEvent): void {
    if (this._initialSortEvent) { // suppress first sort event to prevent emitting wrong order
      this._initialSortEvent = false;
      return;
    }

    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._widget.sortChange(this._order);
      }
    }
  }
}
