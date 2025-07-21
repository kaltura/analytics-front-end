import { Component, OnDestroy, OnInit } from '@angular/core';
import { AreaBlockerMessage } from "@kaltura-ng/kaltura-ui";
import { BroadcastingEntries, BroadcastingEntriesService } from "./broadcasting-entries.service";
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import { AuthService, ErrorsManagerService, NavigationDrillDownService } from "shared/services";
import { ISubscription } from "rxjs/Subscription";
import { KalturaLiveStreamBroadcastStatus } from "kaltura-ngx-client";
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";
import { analyticsConfig, buildCDNUrl } from "configuration/analytics-config";
import { FrameEventManagerService, FrameEvents } from "shared/modules/frame-event-manager/frame-event-manager.service";
import * as moment from "moment";
import { AnalyticsPermissionsService } from "shared/analytics-permissions/analytics-permissions.service";
import { AnalyticsPermissions } from "shared/analytics-permissions/analytics-permissions";

@Component({
  selector: 'app-live-entries-broadcasting',
  templateUrl: './broadcasting.component.html',
  styleUrls: ['./broadcasting.component.scss'],
  providers: [BroadcastingEntriesService]
})

export class BroadcastingComponent implements OnInit, OnDestroy {

  public broadcastingEntries: BroadcastingEntries[] = [];

  public _blockerMessage: AreaBlockerMessage = null;
  public _loadingEntries = false;
  public _totalCount = 0;
  public _polling = false;

  public uiconfid: number;
  public ks: string;
  public cdnUrl: string;
  public poster = '';
  public _loadThumbnailWithKs = false;
  public dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'H:mm MM/d/yy' : 'H:mm d/MM/yy';

  private reportIntervalId = null;
  private timeUpdateIntervalId = null;
  private statusChangeSubscription: ISubscription = null;
  private dataChangeSubscription: ISubscription = null;

  constructor(private _broadcastingEntriesService: BroadcastingEntriesService,
              private _navigationDrillDownService: NavigationDrillDownService,
              private _frameEventManager: FrameEventManagerService,
              private _authService: AuthService,
              private _permissionsService: AnalyticsPermissionsService,
              private _errorsManager: ErrorsManagerService) {
    this.ks = this._authService.ks;
    this.uiconfid = analyticsConfig.kalturaServer.previewUIConfV7;
    this._loadThumbnailWithKs = this._permissionsService.hasPermission(AnalyticsPermissions.FEATURE_LOAD_THUMBNAIL_WITH_KS);
    this.cdnUrl = buildCDNUrl('');
  }

  ngOnInit(): void {
    this.registerStateChange();
    this.registerDataChange();
    this.startPolling();
  }

  private startPolling(): void {
    this._polling = false;
    this.clearIntervals();
    const DATA_LOAD_INTERVAL = 60 * 1000; // 60 seconds interval
    this._broadcastingEntriesService.loadData();
    this.reportIntervalId = setInterval(() => {
      this._broadcastingEntriesService.loadData();
    }, DATA_LOAD_INTERVAL);
    // use a timeout to reload the players as switching entry ID in a playing v7 player doesn't trigger media change
    setTimeout(() => {
      this._polling = true;
    }, 200);
  }

  ngOnDestroy(): void {
    this.clearIntervals();
    this.clearSubscriptions();
  }

  private clearIntervals(): void {
    if (this.reportIntervalId) {
      clearInterval(this.reportIntervalId);
      this.reportIntervalId = null;
    }
    if (this.timeUpdateIntervalId) {
      clearInterval(this.timeUpdateIntervalId);
      this.timeUpdateIntervalId = null;
    }
  }

  private clearSubscriptions(): void {
    if (this.statusChangeSubscription) {
      this.statusChangeSubscription.unsubscribe();
      this.statusChangeSubscription = null;
    }
    if (this.dataChangeSubscription) {
      this.dataChangeSubscription.unsubscribe();
      this.dataChangeSubscription = null;
    }
  }

  private registerStateChange(): void {
    this.statusChangeSubscription = this._broadcastingEntriesService.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        this._loadingEntries = state.isBusy;
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._blockerMessage = null;
              this._broadcastingEntriesService.loadData();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
        if (state.forceRefresh) {
          this.startPolling();
        }
      });
  }

  private registerDataChange(): void {
    this.dataChangeSubscription = this._broadcastingEntriesService.data$
      .pipe(cancelOnDestroy(this))
      .subscribe((data: {entries: BroadcastingEntries[], totalCount: number, update: boolean, forceReload: boolean}) => {
        this._totalCount = data.totalCount;
        if (data.forceReload) {
          this.startPolling();
        } else if (data.update) { // no need to create new entries - only update existing ones
          data.entries.forEach((entry: BroadcastingEntries) => {
            this.broadcastingEntries.forEach((broadcastingEntry: BroadcastingEntries) => {
              if (broadcastingEntry.id === entry.id) {
                Object.assign(broadcastingEntry, entry);
              }
            });
          });
        } else { // need to create entries as we got new entries from the report that do not exist in our broadcastingEntries array
          this.broadcastingEntries = [];
          // deep clone the data.entries array to the broadcastingEntries array
          data.entries.forEach((entry: BroadcastingEntries) => {
            this.broadcastingEntries.push(Object.assign({}, entry));
          });
          if (!this.timeUpdateIntervalId) {
            this.setTimeUpdateInterval();
          }
        }
        this.updateLayout();
      });
  }

  private updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
      }, 200);
    }
  }

  private setTimeUpdateInterval(): void {
    this.timeUpdateIntervalId = setInterval(() => {
      this.broadcastingEntries.forEach((entry: BroadcastingEntries) => {
        if (entry.status !== KalturaLiveStreamBroadcastStatus.offline && entry.currentBroadcastStartTime) {
          entry.broadcastTime = moment.duration(Math.abs(moment().diff(DateFilterUtils.getMomentDate(entry.currentBroadcastStartTime))));
        }
      });
    }, 1000);
  }

  public _drillDown(entry: BroadcastingEntries): void {
    this._navigationDrillDownService.drilldown('entry-live', entry.id, false, entry.partnerId);
  }

  public paginate(event) {
    this._broadcastingEntriesService.paginationChange(event.page + 1);
    this.startPolling();
  }
}
