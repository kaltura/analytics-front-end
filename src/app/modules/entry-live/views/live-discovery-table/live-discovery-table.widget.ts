import { Injectable, OnDestroy } from '@angular/core';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { Observable, of as ObservableOf } from 'rxjs';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { EntryLiveDiscoveryPollsService } from '../../providers/entry-live-discovery-polls.service';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaFilterPager, KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DateRange } from '../live-discovery/filters/filters.service';
import { DateFiltersChangedEvent } from '../live-discovery/filters/filters.component';
import { LiveDiscoveryDevicesTableRequestFactory } from './devices-table/live-discovery-devices-table-request-factory';
import { LiveDiscoveryUsersTableRequestFactory } from './users-table/live-discovery-users-table-request-factory';
import { LiveDiscoveryUsersTableProvider } from './users-table/live-discovery-users-table-provider';
import { LiveDiscoveryDevicesTableProvider } from './devices-table/live-discovery-devices-table-provider';
import { SortEvent } from 'primeng/api';

export type LiveDiscoveryTableWidgetPollFactory = LiveDiscoveryDevicesTableRequestFactory | LiveDiscoveryUsersTableRequestFactory;

export interface LiveDiscoverySummaryData {
  [key: string]: string;
}

export interface LiveDiscoveryTableData {
  table: {
    data: TableRow[],
    columns: string[],
    totalCount: number,
  };
  summary?: LiveDiscoverySummaryData;
  tableMode?: TableModes;
}

export interface LiveDiscoveryTableWidgetProvider {
  getPollFactory(args: WidgetsActivationArgs): LiveDiscoveryTableWidgetPollFactory;
  
  responseMapping(responses: KalturaResponse<KalturaReportTable | KalturaReportTotal>[]): LiveDiscoveryTableData;
}

@Injectable()
export class LiveDiscoveryTableWidget extends WidgetBase<LiveDiscoveryTableData> implements LiveDiscoveryTableWidget, OnDestroy {
  private _provider: LiveDiscoveryTableWidgetProvider;
  private _widgetArgs: WidgetsActivationArgs;
  private _tableMode = TableModes.users;
  
  protected _widgetId = 'discovery-devices-table';
  protected _pollsFactory: LiveDiscoveryTableWidgetPollFactory = null;
  protected _dataConfig: ReportDataConfig;
  protected _dateRange: DateRange;
  protected _showTable = false;
  
  public isBusy = false;
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _frameEventManager: FrameEventManagerService,
              private _devicesProvider: LiveDiscoveryDevicesTableProvider,
              private _usersProvider: LiveDiscoveryUsersTableProvider) {
    super(_serverPolls, _frameEventManager);
    this._setProvider(this._tableMode);
  }
  
  ngOnDestroy(): void {
  }
  
  private _setProvider(tableMode: TableModes): void {
    switch (tableMode) {
      case TableModes.devices:
        this._provider = this._devicesProvider;
        break;
      case TableModes.users:
        this._provider = this._usersProvider;
        break;
      default:
        throw Error('Unsupported table mode: ' + tableMode);
    }
  }
  
  protected _canStartPolling(): boolean {
    return this._showTable;
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs, silent = false): Observable<void> {
    if (!silent) {
      this.isBusy = true;
    }

    this._widgetArgs = widgetsArgs;
    
    this._pollsFactory = this._provider.getPollFactory(widgetsArgs);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaResponse<KalturaReportTable | KalturaReportTotal>[]): LiveDiscoveryTableData {
    this.isBusy = false;
    return { tableMode: this._tableMode, ...this._provider.responseMapping(responses) };
  }
  
  public setTableMode(tableMode: TableModes): void {
    this._tableMode = tableMode;
    
    this.deactivate();
    
    this._setProvider(tableMode);

    this.activate(this._widgetArgs);
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
      this.isBusy = true;
      this.startPolling(!isPolling);
    }
  }
  
  public usersFilterChange(refineFilter: RefineFilter): void {
    if (this._tableMode === TableModes.users) {
      // update filter
      // restart polling
    }
  }
  
  public sortChange(event: string): void {
    if (this._tableMode === TableModes.users) {
      // update filter
      // restart polling
    }
  }
  
  public paginationChange(order: KalturaFilterPager): void {
    if (this._tableMode === TableModes.users) {
      // update filter
      // restart polling
    }
  }
}
