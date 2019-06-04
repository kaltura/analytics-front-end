import { Injectable } from '@angular/core';
import { ReportService } from 'shared/services';
import { KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { getResponseByType } from 'shared/utils/get-response-by-type';
import { WidgetsActivationArgs } from '../../../widgets/widgets-manager';
import { LiveDiscoveryTableData, LiveDiscoveryTableWidgetPollFactory, LiveDiscoveryTableWidgetProvider } from '../live-discovery-table.widget';
import { LiveDiscoveryUsersTableRequestFactory } from './live-discovery-users-table-request-factory';
import { LiveDiscoveryUsersTableConfig } from './live-discovery-users-table.config';
import { ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class LiveDiscoveryUsersTableProvider implements LiveDiscoveryTableWidgetProvider {
  private readonly _dataConfig;
  
  constructor(private _reportService: ReportService,
              private _dataConfigService: LiveDiscoveryUsersTableConfig) {
    this._dataConfig = _dataConfigService.getConfig();
    
  }
  
  getPollFactory(widgetsArgs: WidgetsActivationArgs): LiveDiscoveryTableWidgetPollFactory {
    return new LiveDiscoveryUsersTableRequestFactory(widgetsArgs.entryId);
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
}
