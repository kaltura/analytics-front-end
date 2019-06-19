import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveDiscoveryRequestFactory } from './live-discovery-request-factory';
import { KalturaReportGraph, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { EntryLiveDiscoveryPollsService } from '../../providers/entry-live-discovery-polls.service';
import { LiveDiscoveryConfig } from './live-discovery.config';
import { ReportService } from 'shared/services';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { DateRange, FiltersService, TimeInterval } from './filters/filters.service';
import { getResponseByType } from 'shared/utils/get-response-by-type';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { DateFiltersChangedEvent } from './filters/filters.component';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';

export interface LiveDiscoveryData {
  graphs: { [key: string]: string[] };
  totals?: { [key: string]: string };
}

@Injectable()
export class LiveDiscoveryWidget extends WidgetBase<LiveDiscoveryData> {
  private _dateFilter: DateFiltersChangedEvent;
  
  protected _widgetId = 'explore';
  protected _pollsFactory: LiveDiscoveryRequestFactory = null;
  protected _dataConfig: ReportDataConfig;
  protected _timeInterval: TimeInterval;
  
  private get _dateRange(): DateRange {
    return this._dateFilter ? this._dateFilter.dateRange : null;
  }
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _translate: TranslateService,
              protected _dataConfigService: LiveDiscoveryConfig,
              protected _reportService: ReportService,
              protected _frameEventManager: FrameEventManagerService,
              protected _filterService: FiltersService) {
    super(_serverPolls, _frameEventManager);
    
    this._dataConfig = this._dataConfigService.getConfig();
  }
  
  public updateFilters(event: DateFiltersChangedEvent): void {
    this._dateFilter = event;
  
    this._pollsFactory.interval = this._dateFilter.timeIntervalServerValue;
  
    if (this._dateFilter.isPresetMode) {
      this._pollsFactory.dateRange = this._dateFilter.dateRangeServerValue;
    } else {
      this._pollsFactory.dateRange = {
        fromDate: this._dateFilter.startDate,
        toDate: this._dateFilter.endDate,
      };
    }

    this.restartPolling(!this._dateFilter.isPresetMode);
  }
  private _getFormatByInterval() {
    switch (this._timeInterval) {
      case TimeInterval.Days:
        return 'MMM DD';
      
      case TimeInterval.Minutes:
      case TimeInterval.Hours:
        return 'hh:mm';
      
      case TimeInterval.TenSeconds:
      default:
        return 'hh:mm:ss';
    }
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDiscoveryRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaResponse<KalturaReportTotal | KalturaReportGraph[]>[]): LiveDiscoveryData {
    if (this._dateFilter.isPresetMode) {
      this._pollsFactory.dateRange = this._filterService.getDateRangeServerValue(this._dateRange);
    } else {
      this._pollsFactory.dateRange = {
        fromDate: this._dateFilter.startDate,
        toDate: this._dateFilter.endDate,
      };
    }
    
    const graphsResponse = getResponseByType(responses, KalturaReportGraph) as KalturaReportGraph[] || [];
    const reportGraphFields = this._dataConfig[ReportDataSection.graph].fields;
    const format = this._getFormatByInterval();
    let totals = null;
    const activeUsers = [];
    const graphs = graphsResponse.reduce((result, graph) => {
      const times = [];
      const graphData = [];
      
      graph.data.split(';')
        .filter(Boolean)
        .forEach((valueString, index) => {
          let [rawDate, rawValue] = valueString.split(analyticsConfig.valueSeparator);
          
          if (graph.id === 'view_unique_audience') {
            activeUsers.push(rawValue);
          } else if (graph.id === 'view_unique_buffering_users') {
            const bufferingUsers = Number(rawValue) || 0;
            const activeUsersCount = Number(activeUsers[index]) || 0;
            rawValue = String(activeUsersCount ? bufferingUsers / activeUsersCount : 0);
          }
          
          const value = reportGraphFields[graph.id] ? reportGraphFields[graph.id].format(rawValue) : rawValue;
          
          const time = DateFilterUtils.getTimeStringFromEpoch(rawDate, format);
          
          times.push(time);
          graphData.push(value);
        });
      
      if (!result['times']) {
        result['times'] = times;
      }
      
      result[graph.id] = graphData;
      
      return result;
    }, {});
    
    const totalsResponse = getResponseByType<KalturaReportTotal>(responses, KalturaReportTotal);
    if (totalsResponse && totalsResponse.header && totalsResponse.data) {
      const reportTotalFields = this._dataConfig[ReportDataSection.totals].fields;
      const columns = totalsResponse.header.split(analyticsConfig.valueSeparator);
      const values = totalsResponse.data.split(analyticsConfig.valueSeparator);
      totals = columns
        .reduce((result, column, index) => {
          if (reportTotalFields[column]) {
            let rawValue = values[index];
            if (column === 'view_unique_buffering_users') {
              const activeUsers = Number(values[columns.indexOf('view_unique_audience')]) || 0;
              const value = Number(rawValue) || 0;
              rawValue = String(activeUsers ? value / activeUsers : 0);
            }
            
            result[column] = reportTotalFields[column].format(rawValue);
          }
          
          return result;
        }, {});
    }
    
    return {
      graphs,
      totals,
    };
  }
  
  public setCurrentInterval(interval: TimeInterval): void {
    this._timeInterval = interval;
  }
}
