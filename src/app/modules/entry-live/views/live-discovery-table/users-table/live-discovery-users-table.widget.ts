import { BehaviorSubject, Observable, of as ObservableOf } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportService } from 'shared/services';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { WidgetBase } from '../../../widgets/widget-base';
import { DateRange } from '../../live-discovery/filters/filters.service';
import { EntryLiveDiscoveryPollsService } from '../../../providers/entry-live-discovery-polls.service';
import { LiveDiscoveryUsersTableRequestFactory } from './live-discovery-users-table-request-factory';
import { LiveDiscoveryUsersTableConfig } from './live-discovery-users-table.config';
import { WidgetsActivationArgs } from '../../../widgets/widgets-manager';
import { DateFiltersChangedEvent } from '../../live-discovery/filters/filters.component';
import { LiveDiscoveryTableData, LiveDiscoveryTableWidget } from '../live-discovery-table-proxy.widget';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { getResponseByType } from 'shared/utils/get-response-by-type';

@Injectable()
export class LiveDiscoveryUsersTableWidget extends WidgetBase<LiveDiscoveryTableData> implements LiveDiscoveryTableWidget, OnDestroy {
  protected _widgetId = 'discovery-users-table';
  protected _pollsFactory: LiveDiscoveryUsersTableRequestFactory = null;
  protected _devicesDataConfig: ReportDataConfig;
  protected _dateRange: DateRange;
  
  public _showTable = true;
  public _isBusy = new BehaviorSubject<boolean>(false);
  
  public isBusy$ = this._isBusy.asObservable();
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _translate: TranslateService,
              protected _usersDataConfigService: LiveDiscoveryUsersTableConfig,
              protected _reportService: ReportService,
              protected _frameEventManager: FrameEventManagerService) {
    super(_serverPolls, _frameEventManager);
    
    this._devicesDataConfig = this._usersDataConfigService.getConfig();
  }
  
  ngOnDestroy(): void {
    this._isBusy.complete();
  }
  
  protected _canStartPolling(): boolean {
    return this._showTable;
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._isBusy.next(true);

    this._pollsFactory = new LiveDiscoveryUsersTableRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaResponse<KalturaReportTable | KalturaReportTotal>[]): any {
    this._isBusy.next(false);
  
    let tableResult = {
      data: [],
      columns: [],
      totalCount: 0,
    };
    let summary = {};
  
    const table = getResponseByType<KalturaReportTable>(responses, KalturaReportTable);
    if (table && table.data && table.header) {
      const { columns, tableData } = this._reportService.parseTableData(table, this._devicesDataConfig.table);
      
      tableResult.totalCount = table.totalCount;
      tableResult.columns = columns;
      tableResult.data = tableData;
    }

    return {
      summary,
      table: tableResult,
    };
  }
  
  public retry(): void {
    this._isBusy.next(true);
    super.retry();
  }
  
  public updateFilters(event: DateFiltersChangedEvent): void {
    this._pollsFactory.interval = event.timeIntervalServerValue;
    this._pollsFactory.dateRange = event.dateRangeServerValue;
    
    this._dateRange = event.dateRange;
    
    if (this._showTable) {
      this.restartPolling();
    }
  }
  
  public toggleTable(showTable: boolean, isPolling: boolean): void {
    this._showTable = showTable;
    
    this.updateLayout();
    
    if (!this._showTable) {
      this.stopPolling();
    } else {
      this._isBusy.next(true);
      this.startPolling(!isPolling);
    }
  }
  
  public paginationChange(event): void {
  
  }
  
  public sortChange(event): void {
  
  }
  
  public userFilterChange(event: RefineFilter): void {
  
  }
}
