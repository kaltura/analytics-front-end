import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveDiscoveryRequestFactory } from './live-discovery-request-factory';
import { KalturaReportGraph, KalturaReportTotal, KalturaResponse } from 'kaltura-ngx-client';
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
import * as moment from 'moment';

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

  private get _isPresetMode(): boolean {
    return this._dateFilter ? this._dateFilter.isPresetMode : true;
  }

  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
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

    if (this._isPresetMode) {
      this._pollsFactory.dateRange = this._dateFilter.dateRangeServerValue;
    } else {
      this._pollsFactory.dateRange = {
        fromDate: this._dateFilter.startDate,
        toDate: this._dateFilter.endDate,
      };
    }

    this.restartPolling(!this._isPresetMode);
  }

  public updateFiltersDateRange(dateRange: {startDate: number, endDate: number}): void {
    this._pollsFactory.dateRange = {
      fromDate: dateRange.startDate,
      toDate: dateRange.endDate,
    };
    // TODO: matbe call only the chart service and not the table, check why the selected days are not returned properly
    this.restartPolling(true); // poll only once and pause polling
  }

  private _getDaysCount(): any {
    let startDate;
    let endDate;

    if (this._isPresetMode) {
      startDate = this._dateFilter.dateRangeServerValue.fromDate;
      endDate = this._dateFilter.dateRangeServerValue.toDate;
    } else {
      startDate = this._dateFilter.startDate;
      endDate = this._dateFilter.endDate;
    }

    startDate = moment.unix(startDate);
    endDate = moment.unix(endDate);

    // add one day when not in preset mode since time is part of calculation
    return endDate.diff(startDate, 'days') + (this._isPresetMode ? 0 : 1);
  }

  private _getFormatByInterval(): string {
    switch (this._timeInterval) {
      case TimeInterval.Days:
        return 'MMM DD';

      case TimeInterval.Minutes:
      case TimeInterval.Hours:
        return this._getDaysCount() > 1 ? 'MMM DD HH:mm' : 'HH:mm';

      case TimeInterval.TenSeconds:
      default:
        return 'HH:mm:ss';
    }
  }

  protected _onRestart(): void {
    this._pollsFactory = new LiveDiscoveryRequestFactory(this._activationArgs.entryId);
  }

  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDiscoveryRequestFactory(widgetsArgs.entryId);

    return ObservableOf(null);
  }

  protected _responseMapping(responses: KalturaResponse<KalturaReportTotal | KalturaReportGraph[]>[]): LiveDiscoveryData {
    if (this._isPresetMode) {
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
    const graphs = graphsResponse.reduce((result, graph) => {
      const times = [];
      const epocs = [];
      const graphData = [];

      graph.data.split(';')
        .filter(Boolean)
        .forEach((valueString, index) => {
          const [rawDate, rawValue] = valueString.split(analyticsConfig.valueSeparator);
          const value = reportGraphFields[graph.id] ? reportGraphFields[graph.id].format(rawValue) : rawValue;
          const time = DateFilterUtils.getTimeStringFromEpoch(rawDate, format);

          times.push(time);
          epocs.push(rawDate);
          graphData.push(value);
        });

      if (!result['times']) {
        result['times'] = times;
      }
      if (!result['epocs']) {
        result['epocs'] = epocs;
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
          if (reportTotalFields.hasOwnProperty(column)) {
            result[column] = reportTotalFields[column].format(values[index]);
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
