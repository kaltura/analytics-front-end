import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { SortEvent } from 'primeng/api';
import { Subject } from 'rxjs';
import { KalturaPager } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';

@Component({
  selector: 'app-interactions-table',
  templateUrl: './interactions-table.component.html',
  styleUrls: ['./interactions-table.component.scss']
})
export class InteractionsTableComponent {
  @Input() tableData: TableRow<string>[] = [];
  @Input() showDivider = false;
  @Input() dates: string;
  @Input() isCompareMode: boolean;
  @Input() columns: string[] = [];
  @Input() firstTimeLoading = true;
  @Input() totalCount = 0;
  @Input() name = 'default';
  @Input() pager: KalturaPager;
  @Input() areaBlockerMessage: AreaBlockerMessage;
  @Input() isBusy: boolean;
  
  @Output() drillDown = new EventEmitter<TableRow<string>>();
  @Output() sortChanged = new EventEmitter<SortEvent>();
  @Output() paginationChanged = new EventEmitter<{ page: number, pageCount: number, rows: TableRow<string>, first: number }>();
  
  private _paginationChanged = new Subject<void>();

  public _paginationChanged$ = this._paginationChanged.asObservable();
  
  public _onPaginationChanged(event: { page: number, pageCount: number, rows: TableRow<string>, first: number }): void {
    this._paginationChanged.next();
    this.paginationChanged.emit(event);
  }
  
}
