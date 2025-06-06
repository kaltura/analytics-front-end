import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { SortEvent } from 'primeng/api';
import { Subject } from 'rxjs';
import { KalturaEndUserReportInputFilter, KalturaEntryStatus, KalturaPager } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { EntryDetailsOverlayData } from 'shared/components/entry-details-overlay/entry-details-overlay.component';
import { OverlayPanel } from "primeng/overlaypanel";

@Component({
  selector: 'app-user-highlights-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class UserHighlightsTableComponent {
  @Input() entryDetails: EntryDetailsOverlayData[] = [];
  @Input() userId: string;
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
  @Input() filter: KalturaEndUserReportInputFilter = null;

  @Output() drillDown = new EventEmitter<TableRow<string>>();
  @Output() sortChanged = new EventEmitter<SortEvent>();
  @Output() paginationChanged = new EventEmitter<{ page: number, pageCount: number, rows: TableRow<string>, first: number }>();

  @ViewChild('overlay') _overlay: OverlayPanel;

  private _paginationChanged = new Subject<void>();
  private _timeoutId = null;

  public _entryData: EntryDetailsOverlayData;
  public _paginationChanged$ = this._paginationChanged.asObservable();

  public _onPaginationChanged(event: { page: number, pageCount: number, rows: TableRow<string>, first: number }): void {
    this._paginationChanged.next();
    this.paginationChanged.emit(event);
  }

  public _showOverlay(event: MouseEvent, entryId: string): void {
    if (this._overlay) {
      this._entryData = this.entryDetails.find(({object_id}) => entryId === object_id);
      if (this._timeoutId === null) {
        this._timeoutId = setTimeout(() => {
          if (this._entryData.status === KalturaEntryStatus.ready) {
            this._overlay.show(event);
            this._timeoutId = null;
          }
        }, 1000);
      }
    }
  }

  public _hideOverlay(): void {
    if (this._overlay) {
      this._entryData = null;
      this._overlay.hide();
      if (this._timeoutId) {
        clearTimeout(this._timeoutId);
        this._timeoutId = null;
      }
    }
  }
}
