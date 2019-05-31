import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveDiscoveryTableRequestFactory } from './live-discovery-table-request-factory';
import { TranslateService } from '@ngx-translate/core';
import { EntryLiveDiscoveryPollsService } from '../../providers/entry-live-discovery-polls.service';
import { LiveDiscoveryTableConfig } from './live-discovery-table.config';
import { ReportService } from 'shared/services';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateRange, FiltersService } from '../live-discovery/filters/filters.service';
import { DateFiltersChangedEvent } from '../live-discovery/filters/filters.component';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';

export interface LiveDiscoveryData {
  graphs: { [key: string]: string[] };
  totals?: { [key: string]: string };
}

@Injectable()
export class LiveDiscoveryTableWidget extends WidgetBase<LiveDiscoveryData> {
  protected _widgetId = 'discovery-table';
  protected _pollsFactory: LiveDiscoveryTableRequestFactory = null;
  protected _dataConfig: ReportDataConfig;
  protected _dateRange: DateRange;
  
  public showTable = false;
  public isBusy = false;
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _translate: TranslateService,
              protected _dataConfigService: LiveDiscoveryTableConfig,
              protected _reportService: ReportService,
              protected _frameEventManager: FrameEventManagerService,
              protected _filterService: FiltersService) {
    super(_serverPolls, _frameEventManager);
    
    this._dataConfig = this._dataConfigService.getConfig();
  }
  
  protected _canStartPolling(): boolean {
    return this.showTable;
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDiscoveryTableRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: any): any {
    this.isBusy = false;
    
    console.warn(responses);

    return responses;
  }
  
  public retry(): void {
    super.retry();
    this.isBusy = true;
  }
  
  public updateFilters(event: DateFiltersChangedEvent): void {
    this._pollsFactory.interval = event.timeIntervalServerValue;
    this._pollsFactory.dateRange = event.dateRangeServerValue;
    
    this._dateRange = event.dateRange;
    
    if (this.showTable) {
      this.restartPolling();
    }
  }
  
  public toggleTable(): void {
    this.showTable = !this.showTable;
    
    this.updateLayout();
    
    if (!this.showTable) {
      this.stopPolling();
    } else {
      this.isBusy = true;
      this.startPolling();
    }
  }
  
  public changeTableMode(tableMode: TableModes): void {
  
  }
}
