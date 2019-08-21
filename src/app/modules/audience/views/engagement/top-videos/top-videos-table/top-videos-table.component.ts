import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {KalturaEntryStatus, KalturaFilterPager} from 'kaltura-ngx-client';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import {BrowserService, NavigationDrillDownService} from 'shared/services';
import { Subject } from 'rxjs';
import { SortEvent } from 'primeng/api';
import { EntryDetailsOverlayData } from 'shared/components/entry-details-overlay/entry-details-overlay.component';

@Component({
  selector: 'app-engagement-top-videos-table',
  templateUrl: './top-videos-table.component.html',
  styleUrls: ['./top-videos-table.component.scss']
})
export class TopVideosTableComponent implements OnDestroy {
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
  
  @Input() set order(value: string) {
    if (value) {
      const sortOrder = value[0] === '-' ? -1 : 1;
      if (sortOrder !== this._sortOrder) {
        this._sortOrder = sortOrder;
      }
  
      const sortField = value.slice(1);
      if (sortField !== this._sortField) {
        this._sortField = sortField;
      }
    }
  }
  
  @Output() sortChanged = new EventEmitter<SortEvent>();

  @ViewChild('overlay') _overlay: OverlayComponent;
  
  private _paginationChanged = new Subject<void>();
  private _originalTable: TableRow<string>[] = [];
  private _pageSize = 5;
  private _timeoutId = null;
  
  public _sortField = 'engagement_ranking';
  public _sortOrder = -1;
  public _entryData: EntryDetailsOverlayData;
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });
  public _paginationChanged$ = this._paginationChanged.asObservable();

  constructor(private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService,
              private _browserService: BrowserService) {

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

  public _drillDown({ object_id: entryId, status, partner_id }: { object_id: string, status: string, partner_id: string }): void {
    if (status === '') { // status is already being transformed by formatter function
      this._navigationDrillDownService.drilldown('entry', entryId, true, partner_id);
    }
  }

}
