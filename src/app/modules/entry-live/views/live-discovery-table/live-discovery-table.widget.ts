import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveDiscoveryDevicesTableRequestFactory } from './live-discovery-devices-table-request-factory';
import { TranslateService } from '@ngx-translate/core';
import { EntryLiveDiscoveryPollsService } from '../../providers/entry-live-discovery-polls.service';
import { LiveDiscoveryDevicesTableConfig } from './live-discovery-devices-table.config';
import { ReportHelper, ReportService } from 'shared/services';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateRange } from '../live-discovery/filters/filters.service';
import { DateFiltersChangedEvent } from '../live-discovery/filters/filters.component';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { KalturaFilterPager, KalturaReportTable } from 'kaltura-ngx-client';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { getResponseByType } from 'shared/utils/get-response-by-type';

export interface LiveDiscoveryTableData {
  table: {
    data: TableRow[],
    columns: string[],
    totalCount: number,
  };
  totals?: { [key: string]: string };
}

@Injectable()
export class LiveDiscoveryTableWidget extends WidgetBase<LiveDiscoveryTableData> {
  protected _widgetId = 'discovery-table';
  protected _pollsFactory: LiveDiscoveryDevicesTableRequestFactory = null;
  protected _devicesDataConfig: ReportDataConfig;
  protected _dateRange: DateRange;
  
  public showTable = false;
  public isBusy = false;
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _translate: TranslateService,
              protected _devicesDataConfigService: LiveDiscoveryDevicesTableConfig,
              protected _reportService: ReportService,
              protected _frameEventManager: FrameEventManagerService) {
    super(_serverPolls, _frameEventManager);
    
    this._devicesDataConfig = this._devicesDataConfigService.getConfig();
  }
  
  protected _canStartPolling(): boolean {
    return this.showTable;
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDiscoveryDevicesTableRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: any): any {
    this.isBusy = false;
    
    let result = {
      table: [],
      columns: [],
      totalCount: 0,
    };
    
    const table = getResponseByType<KalturaReportTable>(responses, KalturaReportTable);

    if (table && table.data && table.header) {
      const { columns, tableData } = this._reportService.parseTableData(table, this._devicesDataConfig.table);

      result.totalCount = table.totalCount;
      result.columns = columns;
      result.table = tableData.map((row) => {
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
      table: result,
      totals: null,
    };
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
  
  public toggleTable(isPolling: boolean): void {
    this.showTable = !this.showTable;
    
    this.updateLayout();
    
    if (!this.showTable) {
      this.stopPolling();
    } else {
      this.isBusy = true;
      this.startPolling(!isPolling);
    }
  }
  
  public tableModeChange(tableMode: TableModes): void {
    // switch requests
    // reload data
  }
  
  public usersFilterChange(refineFilter: RefineFilter): void {
    // update filter
    // reload data
  }
  
  public sortChange(event): void {
    // update filter
    // reload data
  }
  
  public paginationChange(pager: KalturaFilterPager): void {
    // update filter
    // reload data
  }
}
