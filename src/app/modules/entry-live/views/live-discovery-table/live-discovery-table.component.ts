import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { filter } from 'rxjs/operators';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { LiveDiscoverySummaryData, LiveDiscoveryTableData, LiveDiscoveryTableWidget } from './live-discovery-table.widget';

@Component({
  selector: 'app-live-discovery-table',
  templateUrl: './live-discovery-table.component.html',
  styleUrls: ['./live-discovery-table.component.scss']
})
export class LiveDiscoveryTableComponent implements OnInit, OnDestroy {
  @Input() isPolling: boolean;
  
  public _blockerMessage: AreaBlockerMessage;
  public _tableMode = TableModes.users;
  public _tableModes = TableModes;
  public _firstTimeLoading = true;
  public _pager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });
  public _totalCount = 0;
  public _columns = [];
  public _tableData: TableRow[] = [];
  public _selectedRefineFilters: RefineFilter = null;
  public _order: string;
  public _showTable = false;
  public _summaryData: LiveDiscoverySummaryData;
  
  constructor(private _errorsManager: ErrorsManagerService,
              public _widget: LiveDiscoveryTableWidget) {
    
  }
  
  ngOnInit() {
    this._widget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._widget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._widget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: LiveDiscoveryTableData) => {
        this._tableMode = data.tableMode;
        this._tableData = data.table.data;
        this._columns = data.table.columns;
        this._totalCount = data.table.totalCount;
        this._summaryData = data.summary;
        this._firstTimeLoading = false;
      });
    
    // TODO remove
    // this._widgetProxy.toggleTable(this._showTable, this.isPolling);
  }
  
  ngOnDestroy(): void {
  }
  
  public _toggleTable(): void {
    this._showTable = !this._showTable;
    this._widget.toggleTable(this._showTable, this.isPolling);
  }
  
}
