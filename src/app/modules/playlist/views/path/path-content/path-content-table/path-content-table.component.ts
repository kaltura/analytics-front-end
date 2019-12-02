import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { KalturaEntryStatus, KalturaFilterPager } from 'kaltura-ngx-client';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { NavigationDrillDownService } from 'shared/services';
import { Subject } from 'rxjs';
import { EntryDetailsOverlayData } from 'shared/components/entry-details-overlay/entry-details-overlay.component';

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
  
  @Input() entryDetails: EntryDetailsOverlayData[] = [];
  @Input() showDivider = false;
  @Input() dates: string;
  @Input() isCompareMode: boolean;
  @Input() columns: string[] = [];
  @Input() firstTimeLoading = true;
  @Input() name = 'default';
  
  private _paginationChanged = new Subject<void>();
  private _originalTable: TableRow<string>[] = [];
  private _pageSize = 5;
  private timeoutId = null;
  
  public _entryData: EntryDetailsOverlayData;
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });
  public _paginationChanged$ = this._paginationChanged.asObservable();
  
  constructor(private _navigationDrillDownService: NavigationDrillDownService) {
  
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
  
  public _drillDown({ object_id: entryId, status, partner_id: partnerId }: { object_id: string, status: string, partner_id: string }): void {
    if (status === '') { // status is already being transformed by formatter function
      this._navigationDrillDownService.drilldown('entry', entryId, true, partnerId);
    }
  }
}
