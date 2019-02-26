import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TableRow } from 'shared/utils/table-local-sort-handler';

@Component({
  selector: 'app-contributors-top-contributors-table',
  templateUrl: './top-contributors-table.component.html',
  styleUrls: ['./top-contributors-table.component.scss']
})
export class TopContributorsTableComponent {
  @Input() set tableData(value: TableRow<string>[]) {
    value = Array.isArray(value) ? value : [];
    this._originalTable = [...value];
    this._tableData = value.slice(0, this._pageSize);
    this._totalCount = value.length;
  }
  
  @Input() showDivider = false;
  @Input() dates: string;
  @Input() isCompareMode: boolean;
  @Input() columns: string[] = [];
  @Input() firstTimeLoading = true;
  
  @Output() sortFieldChanged = new EventEmitter<string>();
  
  @ViewChild('overlay') _overlay: OverlayComponent;
  
  private _originalTable: TableRow<string>[] = [];
  private _pageSize = 5;
  private _currentOrderField = 'count_plays';
  private _currentOrderDirection = -1;
  
  public _userId: string;
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });
  
  constructor(private _logger: KalturaLogger) {
  }
  
  
  public _onSortChanged(event: { data: TableRow<string>[], field: string, mode: string, order: number }): void {
    const { field, order } = event;
    if (!event.data.length || !field || !order || (this._currentOrderDirection === order && this._currentOrderField === field)) {
      return;
    }
  
    this._logger.trace('Handle sort changed action by user', { field, order });
    
    if (field !== this._currentOrderField) {
      this._currentOrderField = field;
      this.sortFieldChanged.emit(this._currentOrderField);
      return;
    }
    
    if (event.order !== this._currentOrderDirection) {
      this._currentOrderDirection = order;
      this._pager.pageIndex = 1;

      this._tableData = this._originalTable
        .sort((a, b) => {
          const valA = Number(a.index);
          const valB = Number(b.index);
          
          return this._currentOrderDirection < 0 ? valA - valB : valB - valA;
        }).slice(0, this._pageSize);
      return;
    }
  }
  
  public _onPaginationChanged(event: { page: number, first: number, rows: number, pageCount: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      this._pager.pageIndex = event.page + 1;
      this._tableData = this._originalTable.slice(event.first, event.first + event.rows);
    }
  }
  
  public _showOverlay(event: any, userId: string): void {
    if (this._overlay) {
      this._userId = userId;
      this._overlay.show(event);
    }
  }
  
  public _hideOverlay(): void {
    if (this._overlay) {
      this._userId = null;
      this._overlay.hide();
    }
  }
}
