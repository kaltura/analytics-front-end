import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {KalturaEntryStatus, KalturaFilterPager} from 'kaltura-ngx-client';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { EntryDetailsOverlayData } from '../entry-details-overlay/entry-details-overlay.component';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { BrowserService } from 'shared/services';

@Component({
  selector: 'app-engagement-top-videos-table',
  templateUrl: './top-videos-table.component.html',
  styleUrls: ['./top-videos-table.component.scss']
})
export class TopVideosTableComponent {
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
  
  @Output() sortFieldChanged = new EventEmitter<string>();
  
  @ViewChild('overlay') _overlay: OverlayComponent;
  
  private _originalTable: TableRow<string>[] = [];
  private _pageSize = 5;
  private timeoutId = null;
  
  public _entryData: EntryDetailsOverlayData;
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });

  constructor(private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _frameEventManager: FrameEventManagerService,
              private _browserService: BrowserService) {

  }
  
  public _onPaginationChanged(event: { page: number, first: number, rows: number, pageCount: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._tableData = this._originalTable.slice(event.first, event.first + event.rows);
    }
  }
  
  public _showOverlay(event: MouseEvent, entryId: string): void {
    if (this._overlay) {
      this._entryData = this.entryDetails.find(({object_id}) => entryId === object_id);
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

  public _drillDown({ object_id: entryId, status }: { object_id: string, status: string }): void {
    if (status === '') { // status is already being transformed by formatter function
      if (analyticsConfig.isHosted) {
        const params = this._browserService.getCurrentQueryParams('string');
        this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/entry?id=${entryId}&${params}`);
      } else {
        this._router.navigate(['entry', entryId], { queryParams: this._activatedRoute.snapshot.queryParams });
      }
    }
  }
}
