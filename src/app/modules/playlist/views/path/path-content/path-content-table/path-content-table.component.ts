import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { Subject } from 'rxjs';
import {SortEvent} from "primeng/api";

@Component({
  selector: 'app-path-content-table',
  templateUrl: './path-content-table.component.html',
  styleUrls: ['./path-content-table.component.scss']
})
export class PathContentTableComponent implements OnDestroy {
  @Input() set tableData(value: TableRow<string>[]) {
    value = Array.isArray(value) ? value : [];
    this._originalTable = [...value];
    this._pager.pageIndex = 1;
    this._tableData = value.slice(0, this._pageSize);
    this._totalCount = value.length;
  }
  
  @Input() showDivider = false;
  @Input() dates: string;
  @Input() isCompareMode: boolean;
  @Input() firstTimeLoading = true;
  @Input() name = 'default';
  
  private _paginationChanged = new Subject<void>();
  private _originalTable: TableRow<string>[] = [];
  private _pageSize = 5;
  
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });
  public _paginationChanged$ = this._paginationChanged.asObservable();
  
  constructor() {
  
  }
  
  ngOnDestroy(): void {
    this._paginationChanged.complete();
  }
  
  public _onPaginationChanged(event: { page: number, first: number, rows: number, pageCount: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._paginationChanged.next();
      this._pager.pageIndex = event.page + 1;
      this._tableData = this._originalTable.slice(event.first, event.first + event.rows);
    }
  }
  
  public customSort(event: SortEvent) {
    event.data.sort((data1, data2) => {
      const numericFields = ['count_node_plays', 'unique_known_users', 'avg_completion_rate'];
      let value1 = data1[event.field];
      let value2 = data2[event.field];
      let result = null;
      if (numericFields.indexOf(event.field) > -1) {
        result = (parseFloat(value1) < parseFloat(value2)) ? -1 : (parseFloat(value1) > parseFloat(value2)) ? 1 : 0; // numeric compare
      } else {
        result = value1.localeCompare(value2); // string compare
      }
      return (event.order * result);
    });
  }
}
