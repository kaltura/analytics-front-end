import { Component, OnDestroy, OnInit } from '@angular/core';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { EntriesLiveService } from './entries-live.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { BrowserService, ErrorsManagerService } from 'shared/services';
import { SortEvent } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';

@Component({
  selector: 'app-entries-live',
  templateUrl: './entries-live.component.html',
  styleUrls: ['./entries-live.component.scss'],
  providers: [
    EntriesLiveService,
  ]
})
export class EntriesLiveComponent implements OnInit, OnDestroy {
  public _tableData: TableRow[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: 25 });
  public _totalCount = 0;
  public _columns: string[] = [];
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage;
  public _freeText = '';
  public _order = '-entry_name';
  public _firstTimeLoading = true;
  
  constructor(private _entriesLiveService: EntriesLiveService,
              private _errorsManager: ErrorsManagerService,
              private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _frameEventManager: FrameEventManagerService,
              private _browserService: BrowserService) {
  }
  
  
  ngOnInit(): void {
    this._entriesLiveService.startPolling();
    
    this._entriesLiveService.data$
      .pipe(cancelOnDestroy(this))
      .subscribe(data => {
        this._columns = data.columns;
        this._tableData = data.table;
        this._totalCount = data.totalCount;
        this._firstTimeLoading = false;
      });
    
    this._entriesLiveService.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        this._isBusy = state.isBusy;
        
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._entriesLiveService.restartPolling();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
  }
  
  ngOnDestroy(): void {
  }
  
  public _rowTrackBy(index: number, item: TableRow): string {
    return item['object_id'];
  }
  
  
  public _drillDown(entry: TableRow): void {
    const entryId = entry['object_id'];
    if (analyticsConfig.isHosted) {
      const params = this._browserService.getCurrentQueryParams('string');
      this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/entry-live?id=${entryId}&${params}`);
    } else {
      this._router.navigate(['entry-live', entryId], { queryParams: this._activatedRoute.snapshot.queryParams });
    }
  }
  
  public _onPaginationChange(event: { page: number, rows: number }): void {
    if (event.page !== (this._pager.pageIndex - 1) || event.rows !== this._pager.pageSize) {
      this._pager.pageIndex = event.page + 1;
      this._pager.pageSize = event.rows;
      this._entriesLiveService.paginationChange(this._pager);
    }
  }
  
  public _onSortChanged(event: SortEvent): void {
    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._entriesLiveService.sortChange(this._order);
      }
    }
  }
}
