import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaClient, KalturaReportType } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter, map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { EntryLiveService, KalturaExtendedLiveEntry } from './entry-live.service';
import { EntryLiveWidget } from './entry-live.widget';
import { WidgetsManager } from './widgets/widgets-manager';
import { LiveUsersWidget } from './views/live-users/live-users.widget';
import { LiveBandwidthWidget } from './views/live-bandwidth/live-bandwidth.widget';
import { LiveStreamHealthWidget } from './views/live-stream-health/live-stream-health.widget';
import { LiveGeoWidget } from './views/live-geo/live-geo.widget';
import { LiveDevicesWidget } from './views/live-devices/live-devices.widget';
import { LiveDiscoveryWidget } from './views/live-discovery-chart/live-discovery.widget';
import { EntryLiveExportConfig } from './entry-live-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { LiveDiscoveryTableWidget } from './views/live-discovery-table/live-discovery-table.widget';
import { DateRange, FiltersService } from './views/live-discovery-chart/filters/filters.service';
import { DateChangeEvent, TimeSelectorService } from './views/live-discovery-chart/time-selector/time-selector.service';
import { DateFiltersChangedEvent } from './views/live-discovery-chart/filters/filters.component';
import { TimeSelectorComponent } from './views/live-discovery-chart/time-selector/time-selector.component';
import { AnalyticsPermissions } from 'shared/analytics-permissions/analytics-permissions';
import { AnalyticsPermissionsService } from 'shared/analytics-permissions/analytics-permissions.service';

@Component({
  selector: 'app-entry-live',
  templateUrl: './entry-live-view.component.html',
  styleUrls: ['./entry-live-view.component.scss'],
  providers: [
    EntryLiveExportConfig,
    TimeSelectorService,
  
    // widgets
    EntryLiveWidget,
    LiveUsersWidget,
    LiveBandwidthWidget,
    LiveStreamHealthWidget,
    LiveGeoWidget,
    LiveDevicesWidget,
    LiveDiscoveryWidget,
    LiveDiscoveryTableWidget,
  ]
})
export class EntryLiveViewComponent implements OnInit, OnDestroy {
  @ViewChild(TimeSelectorComponent) _timeSelector: TimeSelectorComponent;
  private _widgetsRegistered = false;
  
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _entryId: string;
  public _entry: KalturaExtendedLiveEntry;
  public _exportConfig: ExportItem[] = [];
  public _canShowToggleLive = false;
  public _selectedDateRange = DateRange.LastMin;
  public _entryLiveViewConfig = analyticsConfig.viewsConfig.entryLive;
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _errorsManager: ErrorsManagerService,
              private _dateFilter: FiltersService,
              private _router: Router,
              private _kalturaClient: KalturaClient,
              private _route: ActivatedRoute,
              private _entryLiveService: EntryLiveService,
              private _widgetsManager: WidgetsManager,
              private _entryLiveWidget: EntryLiveWidget,
              private _liveUsers: LiveUsersWidget,
              private _liveBandwidth: LiveBandwidthWidget,
              private _liveStreamHealth: LiveStreamHealthWidget,
              private _navigationDrillDownService: NavigationDrillDownService,
              private _liveGeo: LiveGeoWidget,
              private _liveDiscovery: LiveDiscoveryWidget,
              private _liveDevices: LiveDevicesWidget,
              private _liveDiscoveryTable: LiveDiscoveryTableWidget,
              private _exportConfigService: EntryLiveExportConfig,
              private _permissions: AnalyticsPermissionsService) {
    this._exportConfig = _exportConfigService.getConfig();
  }
  
  
  ngOnInit() {
    this._route.params
      .pipe(
        cancelOnDestroy(this),
        map(({ id }) => id || null)
      )
      .subscribe(entryId => {
        this._entryId = entryId;
        this._entryLiveWidget.activate({ entryId });
      });
    
    this._entryLiveWidget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._entryLiveWidget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
    
    this._entryLiveWidget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(data => {
        this._isBusy = false;
        this._entry = data;
        this._canShowToggleLive = this._entryLiveViewConfig.toggleLive
          && this._entry.explicitLive
          && this._permissions.hasPermission(AnalyticsPermissions.FEATURE_LIVE_ANALYTICS_DASHBOARD);
        this._registerWidgets();
        
        if (this._timeSelector) {
          this._timeSelector.updateDataRanges(false);
        }
      });
  }
  
  ngOnDestroy() {
    this._entryLiveWidget.deactivate();
    this._widgetsManager.deactivateAll();
  }
  
  // DO NOT register to entry data widget here!
  // register to all other widgets only once after entry data is received
  private _registerWidgets(): void {
    if (!this._widgetsRegistered) {
      this._widgetsRegistered = true;
      
      const widgetArgs = { entryId: this._entryId };
      const widgets = [];
      const silentWidgets = [];
      
      if (this._entryLiveViewConfig.users) {
        widgets.push(this._liveUsers);
      }
  
      if (this._entryLiveViewConfig.bandwidth) {
        widgets.push(this._liveBandwidth);
      }
  
      if (this._entryLiveViewConfig.streamHealth) {
        widgets.push(this._liveStreamHealth);
      }
  
      if (this._entryLiveViewConfig.geo) {
        widgets.push(this._liveGeo);
      }
  
      if (this._entryLiveViewConfig.devices) {
        widgets.push(this._liveDevices);
      }
      
      if (this._entryLiveViewConfig.discovery) {
        widgets.push(this._liveDiscovery);
        silentWidgets.push(this._liveDiscoveryTable);
      }

      this._widgetsManager.register(widgets, widgetArgs, silentWidgets);
    }
  }
  
  public _navigateToEntry(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, '/content/entries/entry/' + this._entryId);
    }
  }
  
  public _back(): void {
    this._navigationDrillDownService.navigateBack('live/entries-live', false);
  }
  
  public _onGeoDrilldown(event: { reportType: KalturaReportType, drillDown: string[] }): void {
    let update: Partial<ExportItem> = { reportType: event.reportType, additionalFilters: {} };
    
    if (event.drillDown && event.drillDown.length > 0) {
      update.additionalFilters.countryIn = event.drillDown[0];
    }
    
    if (event.drillDown && event.drillDown.length > 1) {
      update.additionalFilters.regionIn = event.drillDown[1];
    }
    
    this._exportConfig = EntryLiveExportConfig.updateConfig(this._exportConfig, 'geo', update);
  }
  
  public _onTableModeChange(reportType: KalturaReportType): void {
    const currentValue = this._exportConfig.find(({ id }) => id === 'discovery');
    const table = currentValue.items.find(({ id }) => id === 'table');
    const tableIndex = currentValue.items.indexOf(table);
    
    table.reportType = reportType;
    
    const update = { items: [...currentValue.items.slice(0, tableIndex), table, ...currentValue.items.slice(tableIndex + 1)] };
    
    this._exportConfig = EntryLiveExportConfig.updateConfig(this._exportConfig, 'discovery', update);
  }
  
  public _onDiscoveryDateFilterChange(event: DateFiltersChangedEvent): void {
    this._exportConfig
      .filter(({ id }) => ['discovery', 'geo', 'devices'].indexOf(id) !== -1)
      .forEach(currentValue => {
        let update;
        if (currentValue.items) {
          const items = currentValue.items.map(item => {
            if (event.isPresetMode) {
              item.startDate = () => this._dateFilter.getDateRangeServerValue(event.dateRange).fromDate;
              item.endDate = () => this._dateFilter.getDateRangeServerValue(event.dateRange).toDate;
            } else {
              item.startDate = () => event.startDate;
              item.endDate = () => event.endDate;
            }
            return item;
          });
          update = { items };
        } else {
          if (event.isPresetMode) {
            update = {
              startDate: () => this._dateFilter.getDateRangeServerValue(event.dateRange).fromDate,
              endDate: () => this._dateFilter.getDateRangeServerValue(event.dateRange).toDate,
            };
          } else {
            update = {
              startDate: () => event.startDate,
              endDate: () => event.endDate,
            };
          }
        }
        
        this._exportConfig = EntryLiveExportConfig.updateConfig(this._exportConfig, currentValue.id, update);
      });
  }
  
  public _liveToggled(): void {
    this._entryLiveWidget.restartPolling();
  }
  
  public _onDateFilterChange(event: DateChangeEvent): void {
    this._selectedDateRange = event.dateRange;
  }
}
