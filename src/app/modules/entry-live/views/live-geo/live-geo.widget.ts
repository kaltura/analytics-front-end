import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveGeoRequestFactory } from './live-geo-request-factory';
import { EntryLiveGeoDevicesPollsService } from '../../providers/entry-live-geo-devices-polls.service';
import { KalturaReportTable, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { significantDigits } from 'shared/utils/significant-digits';
import { ReportHelper, ReportService } from 'shared/services';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { LiveGeoConfig } from './live-geo.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { DateFiltersChangedEvent } from '../live-discovery-chart/filters/filters.component';
import { DateRange, FiltersService } from '../live-discovery-chart/filters/filters.service';

export interface LiveGeoWidgetData {
  table: TableRow[];
  columns: string[];
  totalCount: number;
}

@Injectable()
export class LiveGeoWidget extends WidgetBase<LiveGeoWidgetData> {
  private _dateFilter: DateFiltersChangedEvent;

  protected _widgetId = 'geo';
  protected _pollsFactory: LiveGeoRequestFactory = null;
  protected _dataConfig: ReportDataConfig;
  protected _selectedMetrics: string;
  
  private get _dateRange(): DateRange {
    return this._dateFilter ? this._dateFilter.dateRange : null;
  }
  
  private get _isPresetMode(): boolean {
    return this._dateFilter ? this._dateFilter.isPresetMode : true;
  }
  
  constructor(protected _serverPolls: EntryLiveGeoDevicesPollsService,
              protected _reportService: ReportService,
              protected _frameEventManager: FrameEventManagerService,
              protected _filterService: FiltersService,
              private _dataConfigService: LiveGeoConfig) {
    super(_serverPolls, _frameEventManager);
    this._dataConfig = _dataConfigService.getConfig();
    this._selectedMetrics = this._dataConfig.totals.preSelected;
  }
  
  protected _onRestart(): void {
    this._pollsFactory = new LiveGeoRequestFactory(this._activationArgs.entryId);
    this._applyFilters();
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveGeoRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaResponse<KalturaReportTotal | KalturaReportTable>[]): LiveGeoWidgetData {
    if (this._isPresetMode) {
      this._pollsFactory.dateRange = this._filterService.getDateRangeServerValue(this._dateRange);
    } else {
      this._pollsFactory.dateRange = {
        fromDate: this._dateFilter.startDate,
        toDate: this._dateFilter.endDate,
      };
    }

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
      result.table = tableData.map((row) => {
        const calculateDistribution = (key: string): number => {
          const tab = tabsData.find(item => item.key === key);
          const total = tab ? parseFormattedValue(tab.rawValue) : 0;
          const rowValue = parseFormattedValue(row[key]);
          return significantDigits((rowValue / total) * 100);
        };
        const usersDistribution = calculateDistribution('view_unique_audience');
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
  
  private _applyFilters(): void {
    this._pollsFactory.interval = this._dateFilter.timeIntervalServerValue;
  
    if (this._isPresetMode) {
      this._pollsFactory.dateRange = this._dateFilter.dateRangeServerValue;
    } else {
      this._pollsFactory.dateRange = {
        fromDate: this._dateFilter.startDate,
        toDate: this._dateFilter.endDate,
      };
    }
  }

  public updatePollsFilter(drillDown: string[], restart = false): void {
    this._pollsFactory.drillDown = drillDown;
    
    if (restart) {
      this.restartPolling();
    }
  }
  
  public updateFilters(event: DateFiltersChangedEvent): void {
    this._dateFilter = event;
    this._applyFilters();
    this.restartPolling(!this._isPresetMode);
  }
}
