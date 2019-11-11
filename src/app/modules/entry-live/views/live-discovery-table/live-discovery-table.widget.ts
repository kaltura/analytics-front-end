import { Injectable, OnDestroy } from '@angular/core';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { Observable, of as ObservableOf, Subject } from 'rxjs';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { EntryLiveDiscoveryPollsService } from '../../providers/entry-live-discovery-polls.service';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaAPIException, KalturaClient, KalturaFilterPager, KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { DateRange, DateRangeServerValue, FiltersService } from '../live-discovery-chart/filters/filters.service';
import { DateFiltersChangedEvent } from '../live-discovery-chart/filters/filters.component';
import { LiveDiscoveryDevicesTableRequestFactory } from './devices-table/live-discovery-devices-table-request-factory';
import { LiveDiscoveryUsersTableRequestFactory } from './users-table/live-discovery-users-table-request-factory';
import { LiveDiscoveryUsersTableProvider } from './users-table/live-discovery-users-table-provider';
import { LiveDiscoveryDevicesTableProvider } from './devices-table/live-discovery-devices-table-provider';
import { analyticsConfig } from 'configuration/analytics-config';
import { liveDiscoveryTablePageSize } from './table-config';
import { ToggleUsersModeService } from '../../components/toggle-users-mode/toggle-users-mode.service';
import { EntryLiveUsersMode } from 'shared/utils/live-report-type-map';
import { filter } from 'rxjs/operators';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

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

export interface UsersTableFilter {
  userIds: string;
  pager: KalturaFilterPager;
  order: string;
}

export interface LiveDiscoveryTableWidgetProvider {
  dateRange: DateRangeServerValue;

  getPollFactory(args: WidgetsActivationArgs): LiveDiscoveryTableWidgetPollFactory;
  
  responseMapping(responses: KalturaResponse<KalturaReportTable | KalturaReportTotal>[]): LiveDiscoveryTableData;
  
  hookToPolls(poll$: Observable<{ error: KalturaAPIException; result: KalturaResponse<any>[] }>,
              usersTableFilter?: UsersTableFilter): Observable<{ error: KalturaAPIException; result: LiveDiscoveryTableData }>;
}

@Injectable()
export class LiveDiscoveryTableWidget extends WidgetBase<LiveDiscoveryTableData> implements LiveDiscoveryTableWidget, OnDestroy {
  private _provider: LiveDiscoveryTableWidgetProvider;
  private _widgetArgs: WidgetsActivationArgs;
  private _tableMode = this._usersModeService.usersMode === EntryLiveUsersMode.Authenticated ? TableModes.users : TableModes.devices;
  private _dateFilter: DateFiltersChangedEvent;
  private _usersFilter: UsersTableFilter;
  private _filtersChange = new Subject<void>();
  
  protected _widgetId = 'discovery-devices-table';
  protected _pollsFactory: LiveDiscoveryTableWidgetPollFactory = null;
  protected _dataConfig: ReportDataConfig;
  protected _showTable = false;
  
  public isBusy = false;
  public filtersChange$ = this._filtersChange.asObservable();
  
  private get _dateRange(): DateRange {
    return this._dateFilter ? this._dateFilter.dateRange : null;
  }
  
  private get _isPresetMode(): boolean {
    return this._dateFilter ? this._dateFilter.isPresetMode : true;
  }
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _frameEventManager: FrameEventManagerService,
              protected _filterService: FiltersService,
              private _kalturaClient: KalturaClient,
              private _usersModeService: ToggleUsersModeService,
              private _devicesProvider: LiveDiscoveryDevicesTableProvider,
              private _usersProvider: LiveDiscoveryUsersTableProvider) {
    super(_serverPolls, _frameEventManager);

    this._setProvider(this._tableMode);
    this._resetUsersFilter();

    _usersModeService.usersMode$
      .pipe(cancelOnDestroy(this), filter(mode => mode === EntryLiveUsersMode.All))
      .subscribe(() => {
        this._tableMode = TableModes.devices;
        this._setProvider(this._tableMode);
        this._resetUsersFilter();
      });
  }
  
  ngOnDestroy(): void {
    this._filtersChange.complete();
  }
  
  private _resetUsersFilter(): void {
    this._usersFilter = {
      userIds: '',
      pager: new KalturaFilterPager({ pageSize: liveDiscoveryTablePageSize, pageIndex: 1 }),
      order: '-avg_view_buffering',
    };
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
  
  private _updateProviderDateRange(): void {
    if (this._isPresetMode) {
      this._provider.dateRange = this._filterService.getDateRangeServerValue(this._dateRange);
    } else {
      this._provider.dateRange = {
        fromDate: this._dateFilter.startDate,
        toDate: this._dateFilter.endDate,
      };
    }
  }
  
  private _applyFilters(): void {
    if (this._tableMode === TableModes.users) {
      (<LiveDiscoveryUsersTableRequestFactory>this._pollsFactory).userIds = this._usersFilter.userIds;
      (<LiveDiscoveryUsersTableRequestFactory>this._pollsFactory).pager = this._usersFilter.pager;
      (<LiveDiscoveryUsersTableRequestFactory>this._pollsFactory).order = this._usersFilter.order;
    }
    
    if (this._dateFilter) {
      this._pollsFactory.interval = this._dateFilter.timeIntervalServerValue;
      
      if (this._isPresetMode) {
        this._pollsFactory.dateRange = this._filterService.getDateRangeServerValue(this._dateRange);
      } else {
        this._pollsFactory.dateRange = {
          fromDate: this._dateFilter.startDate,
          toDate: this._dateFilter.endDate,
        };
      }
  
      this._updateProviderDateRange();
    }
  }
  
  protected _canStartPolling(): boolean {
    return this._showTable;
  }
  
  protected _onRestart(): void {
    this._pollsFactory = this._provider.getPollFactory(this._widgetArgs);
    this._applyFilters();
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs, silent = false): Observable<void> {
    if (!silent) {
      this.isBusy = true;
    }
    
    this._widgetArgs = widgetsArgs;
    
    this._pollsFactory = this._provider.getPollFactory(widgetsArgs);
    
    this._applyFilters();
    
    return ObservableOf(null);
  }
  
  // actual response mapping is already done in _hooksToPoll function
  protected _responseMapping(data: LiveDiscoveryTableData): LiveDiscoveryTableData {
    this.isBusy = false;
    
    this._pollsFactory.dateRange = this._filterService.getDateRangeServerValue(this._dateRange);
  
    this._updateProviderDateRange();
    
    return { tableMode: this._tableMode, ...data };
  }
  
  protected _hookToPolls(poll$: Observable<{ error: KalturaAPIException; result: KalturaResponse<any>[] }>): Observable<{ error: KalturaAPIException; result: LiveDiscoveryTableData }> {
    return this._provider.hookToPolls(poll$, this._usersFilter);
  }
  
  public setTableMode(tableMode: TableModes): void {
    this._tableMode = tableMode;
    
    this._resetUsersFilter();
    
    this.deactivate();
    
    this._setProvider(tableMode);
    
    this.activate(this._widgetArgs, false, !this._dateFilter.isPresetMode);
  }
  
  public updateFilters(event: DateFiltersChangedEvent): void {
    this._filtersChange.next();
    this._dateFilter = event;
    
    this._pollsFactory.interval = this._dateFilter.timeIntervalServerValue;
    
    if (this._isPresetMode) {
      this._pollsFactory.dateRange = this._dateFilter.dateRangeServerValue;
    } else {
      this._pollsFactory.dateRange = {
        fromDate: this._dateFilter.startDate,
        toDate: this._dateFilter.endDate,
      };
    }
  
    // reset page
    this._usersFilter.pager.pageIndex = 1;
    (<LiveDiscoveryUsersTableRequestFactory>this._pollsFactory).pager = this._usersFilter.pager;
  
    this._updateProviderDateRange();
    
    if (this._showTable) {
      this.restartPolling(!this._isPresetMode);
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
      this._usersFilter.userIds = refineFilter
        .map(filter => filter.value.id === '0' ? 'Unknown' : filter.value.id) // replace id=0 with Unknown due to the server limitation
        .join(analyticsConfig.valueSeparator);
      (<LiveDiscoveryUsersTableRequestFactory>this._pollsFactory).userIds = this._usersFilter.userIds;
      
      // reset page
      this._usersFilter.pager.pageIndex = 1;
      (<LiveDiscoveryUsersTableRequestFactory>this._pollsFactory).pager = this._usersFilter.pager;

      this.isBusy = true;
      this.restartPolling();
    }
  }
  
  public sortChange(order: string): void {
    if (this._tableMode === TableModes.users) {
      this._usersFilter.order = order;
      (<LiveDiscoveryUsersTableRequestFactory>this._pollsFactory).order = this._usersFilter.order;
      this.isBusy = true;
      this.restartPolling();
    }
  }
  
  public paginationChange(pager: KalturaFilterPager): void {
    if (this._tableMode === TableModes.users) {
      this._usersFilter.pager.pageIndex = pager.pageIndex;
      (<LiveDiscoveryUsersTableRequestFactory>this._pollsFactory).pager = this._usersFilter.pager;
      this.isBusy = true;
      this.restartPolling();
    }
  }
}
