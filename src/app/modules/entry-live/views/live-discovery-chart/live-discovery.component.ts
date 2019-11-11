import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { LiveDiscoveryData, LiveDiscoveryWidget } from './live-discovery.widget';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { DateFiltersChangedEvent } from './filters/filters.component';
import { LiveDiscoveryConfig } from './live-discovery.config';
import { ReportDataFields, ReportDataSection } from 'shared/services/storage-data-base.config';
import { MetricsSelectorChangeEvent } from './metrics-selector/metrics-selector.component';
import { DiscoveryChartComponent } from './discovery-chart/discovery-chart.component';
import { filter } from 'rxjs/operators';
import { LiveDiscoveryTableWidget } from '../live-discovery-table/live-discovery-table.widget';
import { KalturaReportType } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { LiveGeoWidget } from '../live-geo/live-geo.widget';
import { LiveDevicesWidget } from '../live-devices/live-devices.widget';
import { EntryLiveUsersMode } from 'shared/utils/live-report-type-map';
import { ToggleUsersModeService } from '../../components/toggle-users-mode/toggle-users-mode.service';

@Component({
  selector: 'app-live-discovery',
  templateUrl: './live-discovery.component.html',
  styleUrls: ['./live-discovery.component.scss']
})
export class LiveDiscoveryComponent implements OnInit, OnDestroy {
  @Output() tableChange = new EventEmitter<KalturaReportType>();
  @Output() dateFilterChange = new EventEmitter<DateFiltersChangedEvent>();
  @ViewChild(DiscoveryChartComponent, { static: false }) _discoveryChart: DiscoveryChartComponent;
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: LiveDiscoveryData;
  public _fields: ReportDataFields;
  public _selectedMetrics: string[];
  public _colorsMap: { [metric: string]: string } = {};
  public _isPolling: boolean;
  public _pollingBtnDisabled = false;
  public _rangeLabel: string;

  constructor(private _liveExploreWidget: LiveDiscoveryWidget,
              private _liveDiscoveryTable: LiveDiscoveryTableWidget,
              private _liveGeoWidget: LiveGeoWidget,
              private _liveDevicesWidget: LiveDevicesWidget,
              private _errorsManager: ErrorsManagerService,
              private _translate: TranslateService,
              private _usersModeService: ToggleUsersModeService,
              protected _dataConfigService: LiveDiscoveryConfig) {
    _usersModeService.usersMode$
      .pipe(cancelOnDestroy(this))
      .subscribe(mode => {
        this._fields = _dataConfigService.getConfig(mode === EntryLiveUsersMode.Authenticated)[ReportDataSection.graph].fields;
        this._colorsMap = Object.keys(this._fields).reduce((acc, val) => (acc[val] = this._fields[val].colors[0], acc), {});
      });
  }

  ngOnInit() {
    this._liveExploreWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        this._isPolling = state.polling;
        this._isBusy = state.isBusy;

        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            }
          };

          if (state.error.code === 'kmc-server_polls_global_error') {
            state.error.message = state.error.message && state.error.message.indexOf('result limit is') === 0 ? this._translate.instant('app.entryLive.generalErrorMessage') : state.error.message;
          } else {
            actions['retry'] = () => {
              this._blockerMessage = null;
              this._liveExploreWidget.retry();
            };
          }
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });

    this._liveExploreWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: LiveDiscoveryData) => {
        this._data = data;
      });
  }

  ngOnDestroy(): void {
  }

  public _onFiltersChanged(event: DateFiltersChangedEvent): void {
    this._liveExploreWidget.setCurrentInterval(event.timeInterval);
    this._pollingBtnDisabled = !event.isPresetMode;
    this._rangeLabel = event.shortRangeLabel;
  
    this._liveExploreWidget.updateFilters(event, !event.initialRun);

    if (!event.initialRun) {
      this._liveDiscoveryTable.updateFilters(event);
      this._liveDevicesWidget.updateFilters(event);
      this._liveGeoWidget.updateFilters(event);
    }

    this.dateFilterChange.emit(event);
  }

  public _onMetricsSelectorChange(event: MetricsSelectorChangeEvent): void {
    this._selectedMetrics = event.selected;
    if (!event.initialRun && this._discoveryChart) {
      this._discoveryChart.displayMetrics(this._selectedMetrics);
    }
  }

  public _onTogglePolling(): void {
    if (this._isPolling) {
      this._liveExploreWidget.stopPolling();
      this._liveDiscoveryTable.stopPolling();
    } else {
      this._liveExploreWidget.restoreTimeRange();
      this._liveExploreWidget.startPolling();
      this._liveDiscoveryTable.startPolling();
    }

  }

  public onZoom(event): void {
    this._liveExploreWidget.updateFiltersDateRange(event);
  }
}
