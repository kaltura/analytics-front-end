import { BehaviorSubject, Observable, of as ObservableOf } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { LiveDiscoveryDevicesTableRequestFactory } from './live-discovery-devices-table-request-factory';
import { TranslateService } from '@ngx-translate/core';
import { LiveDiscoveryDevicesTableConfig } from './live-discovery-devices-table.config';
import { ReportHelper, ReportService } from 'shared/services';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { getResponseByType } from 'shared/utils/get-response-by-type';
import { WidgetBase } from '../../../widgets/widget-base';
import { DateRange } from '../../live-discovery/filters/filters.service';
import { EntryLiveDiscoveryPollsService } from '../../../providers/entry-live-discovery-polls.service';
import { WidgetsActivationArgs } from '../../../widgets/widgets-manager';
import { DateFiltersChangedEvent } from '../../live-discovery/filters/filters.component';
import { LiveDiscoveryTableData, LiveDiscoveryTableWidget } from '../live-discovery-table-proxy.widget';

@Injectable()
export class LiveDiscoveryDevicesTableWidget extends WidgetBase<LiveDiscoveryTableData> implements LiveDiscoveryTableWidget, OnDestroy {
  protected _widgetId = 'discovery-devices-table';
  protected _pollsFactory: LiveDiscoveryDevicesTableRequestFactory = null;
  protected _devicesDataConfig: ReportDataConfig;
  protected _dateRange: DateRange;
  
  public _showTable = new BehaviorSubject<boolean>(false);
  public _isBusy = new BehaviorSubject<boolean>(false);
  
  public showTable$ = this._showTable.asObservable();
  public isBusy$ = this._isBusy.asObservable();
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _translate: TranslateService,
              protected _devicesDataConfigService: LiveDiscoveryDevicesTableConfig,
              protected _reportService: ReportService,
              protected _frameEventManager: FrameEventManagerService) {
    super(_serverPolls, _frameEventManager);
    
    this._devicesDataConfig = this._devicesDataConfigService.getConfig();
  }
  
  ngOnDestroy(): void {
    this._showTable.complete();
    this._isBusy.complete();
  }
  
  protected _canStartPolling(): boolean {
    return this._showTable.getValue();
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDiscoveryDevicesTableRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaResponse<KalturaReportTable | KalturaReportTotal>[]): LiveDiscoveryTableData {
    this._isBusy.next(false);
    
    let tableResult = {
      data: [],
      columns: [],
      totalCount: 0,
    };
    
    const table = getResponseByType<KalturaReportTable>(responses, KalturaReportTable);
    
    if (table && table.data && table.header) {
      const { columns, tableData } = this._reportService.parseTableData(table, this._devicesDataConfig.table);
      
      tableResult.totalCount = table.totalCount;
      tableResult.columns = columns;
      tableResult.data = tableData.map((row) => {
        const activeUsers = parseFormattedValue(row['view_unique_audience']);
        const bufferingUsers = parseFormattedValue(row['view_unique_buffering_users']);
        const engagedUsers = parseFormattedValue(row['view_unique_engaged_users']);
        row['view_unique_buffering_users'] = activeUsers ? ReportHelper.percents(bufferingUsers / activeUsers, false) : '0%';
        row['view_unique_engaged_users'] = activeUsers ? ReportHelper.percents(engagedUsers / activeUsers, false) : '0%';
        row['view_unique_audience'] = ReportHelper.numberOrZero(activeUsers);
        
        return row;
      });
    }
    
    return {
      table: tableResult,
      totals: null,
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
    
    if (this._showTable.getValue()) {
      this.restartPolling();
    }
  }
  
  public toggleTable(isPolling: boolean): void {
    this._showTable.next(!this._showTable.getValue());
    
    this.updateLayout();
    
    if (!this._showTable.getValue()) {
      this.stopPolling();
    } else {
      this._isBusy.next(true);
      this.startPolling(!isPolling);
    }
  }
}
