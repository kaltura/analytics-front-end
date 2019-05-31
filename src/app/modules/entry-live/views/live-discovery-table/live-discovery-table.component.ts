import { Component, OnDestroy, OnInit } from '@angular/core';
import { LiveDiscoveryTableWidget } from './live-discovery-table.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { SortEvent } from 'primeng/api';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { filter } from 'rxjs/operators';
import { RefineFilter } from 'shared/components/filter/filter.component';

@Component({
  selector: 'app-live-discovery-table',
  templateUrl: './live-discovery-table.component.html',
  styleUrls: ['./live-discovery-table.component.scss']
})
export class LiveDiscoveryTableComponent implements OnInit, OnDestroy {
  public _blockerMessage: AreaBlockerMessage;
  public _data: any;
  public _tableMode = TableModes.users;
  public _tableModes = TableModes;
  public _firstTimeLoading = true;
  public _pager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });
  public _totalCount = 0;
  public _columns = [];
  public _tableData: TableRow[] = [];
  public _selectedRefineFilters: RefineFilter = null;
  
  constructor(private _errorsManager: ErrorsManagerService,
              public _liveDiscoveryTableWidget: LiveDiscoveryTableWidget) {
    
  }
  
  ngOnInit() {
    this._liveDiscoveryTableWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._liveDiscoveryTableWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._liveDiscoveryTableWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: any) => {
        this._data = data;
        this._firstTimeLoading = false;
      });
  }
  
  ngOnDestroy(): void {
  }
  
  public _onTableModeChange(mode: TableModes): void {
    console.warn(mode);
  }
  
  public _onPaginationChange(event): void {
    console.warn(event);
  }
  
  public _onSortChanged(event: SortEvent): void {
    console.warn(event);
  }
  
  public _onRefineFilterChange(event: RefineFilter): void {
    console.warn(event);
  }
}
