import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveGeoRequestFactory } from './live-geo-request-factory';
import { EntryLiveGeoDevicesPollsService } from '../../providers/entry-live-geo-devices-polls.service';
import { KalturaReportTable, KalturaReportTotal, KalturaReportType, KalturaResponse } from 'kaltura-ngx-client';
import { significantDigits } from 'shared/utils/significant-digits';
import { ReportHelper, ReportService } from 'shared/services';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { LiveGeoConfig } from './live-geo.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';

export interface LiveGeoWidgetData {
  table: TableRow[];
  columns: string[];
  totalCount: number;
}

@Injectable()
export class LiveGeoWidget extends WidgetBase<LiveGeoWidgetData> {
  protected _widgetId = 'geo';
  protected _pollsFactory: LiveGeoRequestFactory = null;
  protected _dataConfig: ReportDataConfig;
  protected _selectedMetrics: string;
  
  constructor(protected _serverPolls: EntryLiveGeoDevicesPollsService,
              protected _reportService: ReportService,
              private _dataConfigService: LiveGeoConfig) {
    super(_serverPolls);
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveGeoRequestFactory(widgetsArgs.entryId, widgetsArgs.streamStartTime);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaResponse<KalturaReportTotal | KalturaReportTable>[]): LiveGeoWidgetData {
    const table = this._getResponseByType(responses, KalturaReportTable) as KalturaReportTable;
    const totals = this._getResponseByType(responses, KalturaReportTotal) as KalturaReportTotal;
    let tabsData = [];
    let result = {
      table: [],
      columns: [],
      totalCount: 0,
    };
    
    if (totals && totals.data && totals.header) {
      tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals, this._selectedMetrics);
    }
    
    if (table && table.data && table.header) {
      const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
      columns[0] = columns.splice(1, 1, columns[0])[0]; // switch places between the first 2 columns
      columns.unshift('index'); // add line indexing column at the beginning
      let tmp = columns.pop();
      columns.push('distribution'); // add distribution column at the end
      columns.push(tmp);
      
      result.totalCount = table.totalCount;
      result.columns = columns;
      result.table = tableData.map((row, index) => {
        const calculateDistribution = (key: string): number => {
          const tab = tabsData.find(item => item.key === key);
          const total = tab ? parseFloat((tab.rawValue as string).replace(new RegExp(',', 'g'), '')) : 0;
          const rowValue = row[key] ? parseFloat((row[key] as string).replace(new RegExp(',', 'g'), '')) : 0;
          return significantDigits((rowValue / total) * 100);
        };
        const playsDistribution = calculateDistribution('count_plays');
        const usersDistribution = calculateDistribution('unique_known_users');
        
        row['plays_distribution'] = ReportHelper.numberWithCommas(playsDistribution);
        row['unique_users_distribution'] = ReportHelper.numberWithCommas(usersDistribution);
        
        return row;
      });
    }
    
    return result;
  }
  
  protected _getResponseByType(responses: KalturaResponse<any>[], type: any): any {
    const isType = t => r => r.result instanceof t || Array.isArray(r.result) && r.result.length && r.result[0] instanceof t;
    const result = Array.isArray(responses) ? responses.find(response => isType(type)(response)) : null;
    return result ? result.result : null;
  }
  
  public setTimeRange(range: { to?: number, from?: number }): void {
    this._pollsFactory.timeRange = range;
  }
  
  public updatePollsFilter(drillDown: string[], restart = false): void {
    this._pollsFactory.drillDown = drillDown;
    
    if (restart) {
      this.restartPolling();
    }
  }
}
