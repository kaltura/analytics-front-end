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
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { EntryLiveUsersMode } from 'shared/utils/live-report-type-map';
import { ToggleUsersModeService } from '../../components/toggle-users-mode/toggle-users-mode.service';

export interface LiveDiscoveryData {
  graphs: { [key: string]: string[] };
  totals?: { [key: string]: string };
}

@Injectable()
export class LiveDiscoveryWidget extends WidgetBase<LiveDiscoveryData> {
  private _dateFilter: DateFiltersChangedEvent;
  private _originalDateRange: { dateRange: DateRange, startDate: number, endDate: number, isPresetMode: boolean} = null;

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
              protected _filterService: FiltersService,
              protected _usersModeService: ToggleUsersModeService) {
    super(_serverPolls, _frameEventManager);
  
    _usersModeService.usersMode$
      .pipe(cancelOnDestroy(this))
      .subscribe(mode => {
        this._dataConfig = _dataConfigService.getConfig(mode === EntryLiveUsersMode.Authenticated);
        this.restoreTimeRange();
      });
  }

  private _applyFilters(): void {
    if (this._dateFilter) {
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
  }

  public restoreTimeRange(): void {
    if (this._originalDateRange !== null) {
      this._dateFilter.isPresetMode = this._originalDateRange.isPresetMode;
      if (this._dateFilter.isPresetMode && this._originalDateRange.dateRange) {
        this._dateFilter.dateRange = this._originalDateRange.dateRange;
        this._dateFilter.dateRangeServerValue = this._filterService.getDateRangeServerValue(this._originalDateRange.dateRange);
        console.warn(this._dateFilter.dateRangeServerValue);
      } else {
        this._dateFilter.startDate = this._originalDateRange.startDate;
        this._dateFilter.endDate = this._originalDateRange.endDate;
      }
      
      this._originalDateRange = null;
      this._applyFilters();
    }
  }

  public updateFiltersDateRange(dateRange: {startDate: number, endDate: number}): void {
    if (this._originalDateRange === null) {
      this._originalDateRange = {
        dateRange: this._dateFilter.dateRange,
        startDate: this._dateFilter.startDate,
        endDate: this._dateFilter.endDate,
        isPresetMode: this._dateFilter.isPresetMode,
      };
    }
    this._dateFilter.startDate = dateRange.startDate;
    this._dateFilter.endDate = dateRange.endDate;
    this._dateFilter.isPresetMode = false;
    this.restartPolling(true); // poll only once and pause polling
  }

  private _getFormatByInterval(): string {
    if (this._dateFilter) {
      const timeInterval = (this._dateFilter.endDate - this._dateFilter.startDate) / 60; // get time interval in minutes
      if (timeInterval > 1440) { // more than 1 day, include Month and day
        return 'MMM DD HH:mm';
      } else if (timeInterval > 720 ) { // between 12 and 24 hours hours, show only hours and minutes
        return 'HH:mm';
      } else {
        return 'HH:mm:ss';
      }
    } else {
      return 'HH:mm:ss';
    }
  }

  protected _onRestart(): void {
    this._pollsFactory = new LiveDiscoveryRequestFactory(this._activationArgs.entryId);
    this._applyFilters();
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
            let value = values[index];
            result[column] = reportTotalFields[column].format(value);
          }

          return result;
        }, {});
      
      if (this._usersModeService.usersMode === EntryLiveUsersMode.All) {
        ['viewers', 'viewers_engagement', 'viewers_dvr', 'viewers_buffering'].forEach(column => {
          if (reportTotalFields.hasOwnProperty(column)) {
            const value = String(Math.max(...graphs[column]));
            totals[column] = reportTotalFields[column].format(value);
          }
        });
      }
    }

    return {
      graphs,
      totals,
    };
  }

  public setCurrentInterval(interval: TimeInterval): void {
    this._timeInterval = interval;
  }

  public updateFilters(event: DateFiltersChangedEvent, restart = true): void {
    this._dateFilter = event;

    this._applyFilters();

    if (restart) {
      this.restartPolling(!this._isPresetMode);
    }
  }
}
