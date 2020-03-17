import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { KalturaEntryStatus, KalturaFilterPager } from 'kaltura-ngx-client';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { NavigationDrillDownService } from 'shared/services';
import { Subject } from 'rxjs';
import { EntryDetailsOverlayData } from 'shared/components/entry-details-overlay/entry-details-overlay.component';

@Component({
  selector: 'category-top-content',
  templateUrl: './top-content-table.component.html',
  styleUrls: ['./top-content-table.component.scss']
})
export class CategoryTopContentTableComponent implements OnDestroy {
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
  
  @ViewChild('overlay', { static: false }) _overlay: OverlayComponent;
  
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
  
  public _showOverlay(event: MouseEvent, entryId: string): void {
    if (this._overlay) {
      this._entryData = this.entryDetails.find(({ object_id }) => entryId === object_id);
      if (this.timeoutId === null) {
        this.timeoutId = setTimeout(() => {
          if (this._entryData.status === KalturaEntryStatus.ready) {
            this._overlay.show(event);
            this.timeoutId = null;
          }
        }, 1000);
      }
    }
  }
  
  public _hideOverlay(): void {
    if (this._overlay) {
      this._entryData = null;
      this._overlay.hide();
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }
  
  public _drillDown({ object_id: entryId, status, partner_id: partnerId, entry_source }: { object_id: string, status: string, partner_id: string, entry_source: string }): void {
    if (status === '') { // status is already being transformed by formatter function
      const path = entry_source === 'Interactive Video' ? 'playlist' : 'entry';
      this._navigationDrillDownService.drilldown(path, entryId, true, partnerId);
    }
  }
}
