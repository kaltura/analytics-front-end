import { Component, OnDestroy, OnInit } from '@angular/core';
import { LiveDiscoveryTableWidget } from './live-discovery-table.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { SelectItem, SortEvent } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-live-discovery-table',
  templateUrl: './live-discovery-table.component.html',
  styleUrls: ['./live-discovery-table.component.scss']
})
export class LiveDiscoveryTableComponent implements OnInit, OnDestroy {
  public _blockerMessage: AreaBlockerMessage;
  public _data: any;
  public _tableMode: TableModes;
  public _firstTimeLoading = true;
  public _pager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });
  public _totalCount = 0;
  public _columns = [];
  public _tableData: TableRow[] = [];
  public _tableModes: SelectItem[] = [
    { label: this._translate.instant('app.entryLive.discovery.users'), value: TableModes.users },
    { label: this._translate.instant('app.entryLive.discovery.devices'), value: TableModes.devices },
  ];
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _translate: TranslateService,
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
    this._tableMode = mode;
  }
  
  public _onPaginationChange(event): void {
    console.warn(event);
  }
  
  public _onSortChanged(event: SortEvent): void {
    console.warn(event);
  }
}
