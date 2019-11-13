import { Injectable, OnDestroy } from '@angular/core';
import { LiveDiscoveryDevicesTableRequestFactory } from './live-discovery-devices-table-request-factory';
import { LiveDiscoveryDevicesTableConfig } from './live-discovery-devices-table.config';
import { ReportHelper, ReportService } from 'shared/services';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { KalturaAPIException, KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { getResponseByType } from 'shared/utils/get-response-by-type';
import { WidgetsActivationArgs } from '../../../widgets/widgets-manager';
import { LiveDiscoveryTableData, LiveDiscoveryTableWidgetPollFactory, LiveDiscoveryTableWidgetProvider } from '../live-discovery-table.widget';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DateRangeServerValue } from '../../live-discovery-chart/filters/filters.service';
import { ToggleUsersModeService } from '../../../components/toggle-users-mode/toggle-users-mode.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { EntryLiveUsersMode } from 'configuration/analytics-config';

@Injectable()
export class LiveDiscoveryDevicesTableProvider implements LiveDiscoveryTableWidgetProvider, OnDestroy {
  private _dataConfig: ReportDataConfig;
  
  public dateRange: DateRangeServerValue;
  
  constructor(private _reportService: ReportService,
              private _dataConfigService: LiveDiscoveryDevicesTableConfig,
              private _usersModeService: ToggleUsersModeService) {
    _usersModeService.usersMode$
      .pipe(cancelOnDestroy(this))
      .subscribe(mode => {
        this._dataConfig = _dataConfigService.getConfig(mode === EntryLiveUsersMode.Authenticated);
      });
  }
  
  public ngOnDestroy(): void {
  
  }

  public getPollFactory(widgetsArgs: WidgetsActivationArgs): LiveDiscoveryTableWidgetPollFactory {
    return new LiveDiscoveryDevicesTableRequestFactory(widgetsArgs.entryId);
  }
  
  public responseMapping(responses: KalturaResponse<KalturaReportTable | KalturaReportTotal>[]): LiveDiscoveryTableData {
    let tableResult = {
      data: [],
      columns: [],
      totalCount: 0,
    };
    let summary = {};
    
    const mapData = row => {
      const activeUsers = parseFormattedValue(row['view_unique_audience']);
      const engagedUsers = parseFormattedValue(row['view_unique_engaged_users']);
      row['view_unique_engaged_users'] = activeUsers ? ReportHelper.percents(engagedUsers / activeUsers, false) : '0%';
      return row;
    };
    
    const table = getResponseByType<KalturaReportTable>(responses, KalturaReportTable);
    if (table && table.data && table.header) {
      const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
      
      tableResult.totalCount = table.totalCount;
      tableResult.columns = columns;
      tableResult.data = tableData.map(mapData);
    }
    
    const totals = getResponseByType<KalturaReportTotal>(responses, KalturaReportTotal);
    if (totals && totals.data && totals.header) {
      const { columns, tableData: totalsData } = this._reportService.parseTableData(totals, this._dataConfig[ReportDataSection.totals]);
      const summaryValues = totalsData.map(mapData)[0];
      summary = columns.reduce((acc, val) => (acc[val] = summaryValues[val], acc), {});
    }
    
    return {
      summary,
      table: tableResult,
    };
  }
  
  public hookToPolls(poll$: Observable<{ error: KalturaAPIException; result: KalturaResponse<any>[] }>): Observable<{ error: KalturaAPIException; result: LiveDiscoveryTableData }> {
    return poll$
      .pipe(map(response => {
        if (response.error) { // pass thru an error
          return { ...response, result: null };
        }
        
        return { ...response, result: this.responseMapping(response.result) };
      }));
  }
}
