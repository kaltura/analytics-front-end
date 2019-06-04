import { Injectable } from '@angular/core';
import { DateFiltersChangedEvent } from '../live-discovery/filters/filters.component';
import { LiveDiscoveryDevicesTableWidget } from './devices-table/live-discovery-devices-table.widget';
import { LiveDiscoveryUsersTableWidget } from './users-table/live-discovery-users-table.widget';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { Observable } from 'rxjs';
import { WidgetBase, WidgetState } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { TableRow } from 'shared/utils/table-local-sort-handler';

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
}

export interface LiveDiscoveryTableWidget {
  isBusy$: Observable<boolean>;
  
  updateFilters(event: DateFiltersChangedEvent): void;
  
  toggleTable(showTable: boolean, isPolling: boolean): void;
  
  retry(): void;
}

@Injectable()
export class LiveDiscoveryTableProxyWidget {
  private _currentService: WidgetBase<LiveDiscoveryTableData> & LiveDiscoveryTableWidget;
  private _tableMode = TableModes.users;
  private _widgetArgs: WidgetsActivationArgs;
  
  public isPolling: boolean;
  
  public get data$(): Observable<LiveDiscoveryTableData> {
    return this._currentService.data$;
  }
  
  public get state$(): Observable<WidgetState> {
    return this._currentService.state$;
  }
  
  public get isBusy$(): Observable<boolean> {
    return this._currentService.isBusy$;
  }
  
  constructor(private _devicesWidget: LiveDiscoveryDevicesTableWidget,
              private _usersWidget: LiveDiscoveryUsersTableWidget) {
    this._setService(this._tableMode);
  }
  
  private _setService(tableMode: TableModes): void {
    switch (tableMode) {
      case TableModes.devices:
        this._currentService = this._devicesWidget;
        break;
      case TableModes.users:
        this._currentService = this._usersWidget;
        break;
      default:
        throw Error('Unsupported table mode: ' + tableMode);
    }
  }
  
  public activate(widgetsArgs: WidgetsActivationArgs, silent = false): void {
    if (widgetsArgs) {
      this._widgetArgs = widgetsArgs;
      this.isPolling = !silent;
      
      this._currentService.activate(widgetsArgs, silent);
    }
  }
  
  public deactivate(): void {
    if (this._currentService) {
      this._currentService.deactivate();
    }
  }
  
  public retry(): void {
    this._currentService.retry();
  }
  
  public updateFilters(event: DateFiltersChangedEvent): void {
    this._currentService.updateFilters(event);
  }
  
  public startPolling(): void {
    this._currentService.startPolling();
  }
  
  public stopPolling(): void {
    this._currentService.stopPolling();
  }
  
  public toggleTable(showTable: boolean, isPolling: boolean): void {
    this._currentService.toggleTable(showTable, isPolling);
  }
  
  public setTableMode(tableMode: TableModes, isPolling: boolean): void {
    this._tableMode = tableMode;
    
    this.deactivate();
    
    this._setService(tableMode);
    
    this.activate(this._widgetArgs, !isPolling);
  }
  
  public usersFilterChange(refineFilter: RefineFilter): void {
    if (this._tableMode === TableModes.users) {
      (<LiveDiscoveryUsersTableWidget>this._currentService).userFilterChange(refineFilter);
    }
  }
}
