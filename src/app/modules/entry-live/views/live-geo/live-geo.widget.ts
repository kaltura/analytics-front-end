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
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { ToggleUsersModeService } from '../../components/toggle-users-mode/toggle-users-mode.service';
import { EntryLiveUsersMode } from 'configuration/analytics-config';

export interface LiveGeoWidgetData {
  table: TableRow[];
  columns: string[];
  totalCount: number;
  selectedMetric: string;
}

@Injectable()
export class LiveGeoWidget extends WidgetBase<LiveGeoWidgetData> {
  private _dateFilter: DateFiltersChangedEvent;
  private _drillDown: string[] = [];
  private _isAuthUsers = this._usersModeService.usersMode === EntryLiveUsersMode.Authenticated;

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
              private _dataConfigService: LiveGeoConfig,
              private _usersModeService: ToggleUsersModeService) {
    super(_serverPolls, _frameEventManager);
  
    this._dataConfig = _dataConfigService.getConfig(this._isAuthUsers);
    this._selectedMetrics = this._dataConfig.totals.preSelected;

    _usersModeService.usersMode$
      .pipe(cancelOnDestroy(this))
      .subscribe(mode => {
        this._isAuthUsers = mode === EntryLiveUsersMode.Authenticated;
        this._dataConfig = _dataConfigService.getConfig(this._isAuthUsers);
        this._selectedMetrics = this._dataConfig.totals.preSelected;
      });
  }

  protected _onRestart(): void {
    this._pollsFactory = new LiveGeoRequestFactory(this._activationArgs.entryId);
    this._applyFilters();
  }

  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveGeoRequestFactory(widgetsArgs.entryId);

    return ObservableOf(null);
  }

  protected _responseMapping(table: KalturaReportTable): LiveGeoWidgetData {
    if (this._isPresetMode) {
      this._pollsFactory.dateRange = this._filterService.getDateRangeServerValue(this._dateRange);
    } else {
      this._pollsFactory.dateRange = {
        fromDate: this._dateFilter.startDate,
        toDate: this._dateFilter.endDate,
      };
    }

    let result = {
      table: [],
      columns: [],
      totalCount: 0,
      selectedMetric: this._selectedMetrics,
    };

    if (table && table.data && table.header) {
      const { columns, tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
      columns[0] = columns.splice(1, 1, columns[0])[0]; // switch places between the first 2 columns
      columns.unshift('index'); // add line indexing column at the beginning
      let tmp = columns.pop();
      columns.push('distribution'); // add distribution column at the end
      columns.push(tmp);

      result.totalCount = table.totalCount;
      result.columns = columns;
      const total = tableData.reduce((acc, val) => acc + parseFormattedValue(val[this._selectedMetrics]), 0);
      const calculateDistribution = (row: TableRow): number => {
        const rowValue = parseFormattedValue(row[this._selectedMetrics]);
        return significantDigits((rowValue / total) * 100);
      };
      result.table = tableData.map(row => {
        const usersDistribution = calculateDistribution(row);
        row['distribution'] = ReportHelper.numberWithCommas(usersDistribution);

        return row;
      }).sort((a, b) => {
        const aVal = parseFormattedValue(this._isAuthUsers ? a['view_unique_audience'] : a['views']);
        const bVal = parseFormattedValue(this._isAuthUsers ? b['view_unique_audience'] : b['views']);
        return bVal - aVal;
      });
    }

    return result;
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
    this._pollsFactory.drillDown = this._drillDown;
  }

  public updatePollsFilter(drillDown: string[], restart = false): void {
    this._drillDown = this._pollsFactory.drillDown = drillDown;

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
