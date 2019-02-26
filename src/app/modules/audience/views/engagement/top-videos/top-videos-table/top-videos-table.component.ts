import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {KalturaEntryStatus, KalturaFilterPager} from 'kaltura-ngx-client';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { EntryDetailsOverlayData } from '../entry-details-overlay/entry-details-overlay.component';

@Component({
  selector: 'app-engagement-top-videos-table',
  templateUrl: './top-videos-table.component.html',
  styleUrls: ['./top-videos-table.component.scss']
})
export class TopVideosTableComponent {
  @Input() set tableData(value: any[]) {
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
  
  @Output() sortFieldChanged = new EventEmitter<string>();
  
  @ViewChild('overlay') _overlay: OverlayComponent;
  
  private _originalTable: any[] = [];
  private _pageSize = 5;
  private _currentOrderField = 'count_plays';
  private _currentOrderDirection = -1;
  
  public _entryData: EntryDetailsOverlayData;
  public _totalCount = 0;
  public _tableData: any[] = [];
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });

  constructor(private _router: Router,
              private _frameEventManager: FrameEventManagerService) {

  }
  
  public _onSortChanged(event: { data: any[], field: string, mode: string, order: number }): void {
    const { field, order } = event;
    if (!event.data.length || !field || !order || (this._currentOrderDirection === order && this._currentOrderField === field)) {
      return;
    }
    
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
          const valA = a.index;
          const valB = b.index;
          
          return this._currentOrderDirection < 0 ? valA - valB : valB - valA;
        }).slice(0, this._pageSize);
      return;
    }
  }
  
  public _onPaginationChanged(event: { page: number, first: number, rows: number, pageCount: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._tableData = this._originalTable.slice(event.first, event.first + event.rows);
    }
  }
  
  public _showOverlay(event: MouseEvent, entryId: string): void {
    if (this._overlay) {
      this._entryData = this.entryDetails.find(({ object_id }) => entryId === object_id);
      if (this._entryData.status === KalturaEntryStatus.ready) {
        this._overlay.show(event);
      }
    }
  }
  
  public _hideOverlay(): void {
    if (this._overlay) {
      this._entryData = null;
      this._overlay.hide();
    }
  }

  public _drillDown(entryId: string): void {
    if (this._entryData.status === KalturaEntryStatus.ready) {
      if (analyticsConfig.isHosted) {
        this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/entry?id=${entryId}`);
      } else {
        this._router.navigate(['entry', entryId]);
      }
    }
  }
}
