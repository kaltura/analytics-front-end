import { Injectable } from '@angular/core';
import { ReportService } from 'shared/services';
import { KalturaAPIException, KalturaClient, KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { getResponseByType } from 'shared/utils/get-response-by-type';
import { WidgetsActivationArgs } from '../../../widgets/widgets-manager';
import { LiveDiscoveryTableData, LiveDiscoveryTableWidgetPollFactory, LiveDiscoveryTableWidgetProvider, UsersTableFilter } from '../live-discovery-table.widget';
import { LiveDiscoveryUsersAggregatedTableRequestFactory } from './live-discovery-users-aggregated-table-request-factory';
import { LiveDiscoveryUsersTableConfig } from './live-discovery-users-table.config';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of as ObservableOf } from 'rxjs';
import { analyticsConfig } from 'configuration/analytics-config';
import { LiveDiscoveryUsersLiveTableRequestFactory } from './live-discovery-users-live-table-request-factory';
import { FiltersService } from '../../live-discovery-chart/filters/filters.service';

@Injectable()
export class LiveDiscoveryUsersTableProvider implements LiveDiscoveryTableWidgetProvider {
  private readonly _dataConfig: ReportDataConfig;
  private _entryId: string;
  
  constructor(private _reportService: ReportService,
              private _filterService: FiltersService,
              private _kalturaClient: KalturaClient,
              private _dataConfigService: LiveDiscoveryUsersTableConfig) {
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  getPollFactory(widgetsArgs: WidgetsActivationArgs): LiveDiscoveryTableWidgetPollFactory {
    this._entryId = widgetsArgs.entryId;
    
    return new LiveDiscoveryUsersAggregatedTableRequestFactory(this._entryId);
  }
  
  responseMapping(responses: KalturaResponse<KalturaReportTable | KalturaReportTotal>[]): LiveDiscoveryTableData {
    let tableResult = {
      data: [],
      columns: [],
      totalCount: 0,
    };
    let summary = {};
    
    const table = getResponseByType<KalturaReportTable>(responses, KalturaReportTable);
    if (table && table.data && table.header) {
      const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
      
      tableResult.totalCount = table.totalCount;
      tableResult.columns = columns;
      tableResult.data = tableData;
    }
    
    const totals = getResponseByType<KalturaReportTotal>(responses, KalturaReportTotal);
    if (totals && totals.data && totals.header) {
      const { columns, tableData: totalsData } = this._reportService.parseTableData(totals, this._dataConfig[ReportDataSection.totals]);
      const summaryValues = totalsData[0];
      summary = columns.reduce((acc, val) => (acc[val] = summaryValues[val], acc), {});
    }
    
    return {
      summary,
      table: tableResult,
    };
  }
  
  hookToPolls(poll$: Observable<{ error: KalturaAPIException; result: KalturaResponse<any>[] }>,
              usersTableFilter?: UsersTableFilter): Observable<{ error: KalturaAPIException; result: LiveDiscoveryTableData }> {
    return poll$
      .pipe(switchMap(response => {
        if (response.error) { // pass thru an error
          return ObservableOf({ ...response, result: null });
        }
        
        const result = this.responseMapping(response.result);
        const userIds = result.table.data.map((row) => row['user_id']).join(analyticsConfig.valueSeparator);
        
        if (userIds) { // call for live status data if userIds is not empty
          const liveDataRequestFactory = new LiveDiscoveryUsersLiveTableRequestFactory(this._entryId);
          liveDataRequestFactory.userIds = userIds;
          liveDataRequestFactory.pager = usersTableFilter.pager;
          liveDataRequestFactory.order = usersTableFilter.order;
          
          return this._kalturaClient.multiRequest(liveDataRequestFactory.create())
            .pipe(map(liveDataResponse => {
              console.warn(liveDataResponse);
              
              return { ...response, result };
            }));
        }
        
        return ObservableOf({ ...response, result });
      }));
  }
}
