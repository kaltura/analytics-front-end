import { Injectable } from '@angular/core';
import { ReportHelper, ReportService } from 'shared/services';
import { KalturaAPIException, KalturaClient, KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { getResponseByType } from 'shared/utils/get-response-by-type';
import { WidgetsActivationArgs } from '../../../widgets/widgets-manager';
import { LiveDiscoveryTableData, LiveDiscoveryTableWidgetPollFactory, LiveDiscoveryTableWidgetProvider, UsersTableFilter } from '../live-discovery-table.widget';
import { LiveDiscoveryUsersTableRequestFactory } from './live-discovery-users-table-request-factory';
import { LiveDiscoveryUsersTableConfig } from './live-discovery-users-table.config';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of as ObservableOf } from 'rxjs';
import { analyticsConfig } from 'configuration/analytics-config';
import { LiveDiscoveryUsersStatusRequestFactory } from './live-discovery-users-status-request-factory';
import { FiltersService } from '../../live-discovery-chart/filters/filters.service';
import { LiveDiscoveryUsersStatusConfig, UserStatus } from './live-discovery-users-status.config';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class LiveDiscoveryUsersTableProvider implements LiveDiscoveryTableWidgetProvider {
  private readonly _dataConfig: ReportDataConfig;
  private readonly _statusDataConfig: ReportDataConfig;
  private _entryId: string;
  
  constructor(private _reportService: ReportService,
              private _filterService: FiltersService,
              private _kalturaClient: KalturaClient,
              private _translate: TranslateService,
              private _dataConfigService: LiveDiscoveryUsersTableConfig,
              private _statusDataConfigService: LiveDiscoveryUsersStatusConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    this._statusDataConfig = _statusDataConfigService.getConfig();
  }
  
  private _getStatusColor(status: UserStatus): string {
    switch (status) {
      case UserStatus.live:
        return '#31bea6';
      case UserStatus.dvr:
        return '#60e4cc';
      case UserStatus.offline:
      default:
        return '#cccccc';
    }
  }
  
  public getPollFactory(widgetsArgs: WidgetsActivationArgs): LiveDiscoveryTableWidgetPollFactory {
    this._entryId = widgetsArgs.entryId;
    
    return new LiveDiscoveryUsersTableRequestFactory(this._entryId);
  }
  
  public responseMapping(responses: KalturaResponse<KalturaReportTable | KalturaReportTotal>[]): LiveDiscoveryTableData {
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
  
  public hookToPolls(poll$: Observable<{ error: KalturaAPIException; result: KalturaResponse<any>[] }>,
                     usersTableFilter?: UsersTableFilter): Observable<{ error: KalturaAPIException; result: LiveDiscoveryTableData }> {
    return poll$
      .pipe(switchMap(response => {
        if (response.error) { // pass thru an error
          return ObservableOf({ ...response, result: null });
        }
        
        const result = this.responseMapping(response.result);
        const userIds = result.table.data.map((row) => row['user_id']).join(analyticsConfig.valueSeparator);
        
        if (userIds) { // call for live status data if userIds is not empty
          const liveDataRequestFactory = new LiveDiscoveryUsersStatusRequestFactory(this._entryId);
          liveDataRequestFactory.userIds = userIds;

          return this._kalturaClient.multiRequest(liveDataRequestFactory.create())
            .pipe(map(liveDataResponse => {
              if (liveDataResponse.hasErrors()) {
                return { ...response, error: liveDataResponse.getFirstError() };
              }
              
              const statusData = liveDataResponse[0].result;
              let usersStatusList = [];
              if (statusData && statusData.data && statusData.header) {
                const { tableData } = this._reportService.parseTableData(statusData, this._statusDataConfig.table);
                
                // the server might return several statuses for a user
                // grab first matching status by user_id and remove the rest
                usersStatusList = tableData.filter((statusItem, index, self) => {
                  return index === self.findIndex(item => item['user_id'] === statusItem['user_id']);
                });
              }
              
              // add user status data
              result.table.data.forEach(item => {
                const relevantStatus = usersStatusList.find(statusItem => statusItem['user_id'] === item['user_id']);
                item['status'] = relevantStatus && UserStatus[relevantStatus['playback_type']]
                  ? UserStatus[relevantStatus['playback_type']]
                  : UserStatus.offline;
              });
              
              result.table.columns.splice(1, 0, 'status'); // add status column
              
              const totalStatusData = liveDataResponse[1].result;
              let statusTotals = [{
                value: 0,
                label: this._translate.instant('app.entryLive.discovery.userStatus.offline'),
                color: this._getStatusColor(UserStatus.offline),
              }];
              if (totalStatusData && totalStatusData.data && totalStatusData.header) {
                const { tableData } = this._reportService.parseTableData(totalStatusData, this._statusDataConfig['totalsTable']);
                const totalViewTime = tableData.reduce((acc, val) => acc + Number(val['sum_view_time']), 0);
                statusTotals = tableData.map(item => {
                  const parsedValue = Number(item['sum_view_time']);
                  const typeLabel = this._translate.instant(`app.entryLive.discovery.userStatus.${item['playback_type']}`);
                  const tooltip = this._translate.instant(
                    `app.entryLive.discovery.userStatusCount.${item['playback_type']}`,
                    [totalViewTime ? ReportHelper.percents(parsedValue / totalViewTime) : '0%']
                  );
                  return {
                    value: parsedValue,
                    color: this._getStatusColor(item['playback_type'] as UserStatus),
                    label: typeLabel,
                    tooltip: tooltip,
                  };
                });
              }
              
              result.summary['status'] = statusTotals as any;
              
              return { ...response, result };
            }));
        }
        
        return ObservableOf({ ...response, result });
      }));
  }
}
