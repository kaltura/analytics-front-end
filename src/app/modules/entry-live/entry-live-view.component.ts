import { Component, OnDestroy, OnInit } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaClient } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter, map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorsManagerService } from 'shared/services';
import { EntryLiveService, KalturaExtendedLiveEntry } from './entry-live.service';
import { EntryLiveWidget } from './entry-live.widget';
import { WidgetsManager } from './widgets/widgets-manager';
import { LiveUsersWidget } from './views/live-users/live-users.widget';
import { LiveBandwidthWidget } from './views/live-bandwidth/live-bandwidth.widget';
import { LiveStreamHealthWidget } from './views/live-stream-health/live-stream-health.widget';
import { LiveGeoWidget } from './views/live-geo/live-geo.widget';
import { LiveDevicesWidget } from './views/live-devices/live-devices.widget';

@Component({
  selector: 'app-entry-live',
  templateUrl: './entry-live-view.component.html',
  styleUrls: ['./entry-live-view.component.scss'],
})
export class EntryLiveViewComponent implements OnInit, OnDestroy {
  private _widgetsRegistered = false;

  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _entryId: string;
  public _entry: KalturaExtendedLiveEntry;
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _errorsManager: ErrorsManagerService,
              private _router: Router,
              private _kalturaClient: KalturaClient,
              private _route: ActivatedRoute,
              private _entryLiveService: EntryLiveService,
              private _widgetsManager: WidgetsManager,
              private _entryLiveWidget: EntryLiveWidget,
              private _liveUsers: LiveUsersWidget,
              private _liveBandwidth: LiveBandwidthWidget,
              private _liveStreamHealth: LiveStreamHealthWidget,
              private _liveGeo: LiveGeoWidget,
              private _liveDevices: LiveDevicesWidget) {
  }
  
  
  ngOnInit() {
    if (analyticsConfig.isHosted) {
      this._frameEventManager
        .listen(FrameEvents.UpdateFilters)
        .pipe(
          cancelOnDestroy(this),
          filter(Boolean),
          map(({ queryParams }) => queryParams['id'] || null),
        )
        .subscribe(entryId => {
          this._entryId = entryId;
          this._entryLiveWidget.activate({ entryId });
        });
    } else {
      this._route.params
        .pipe(
          cancelOnDestroy(this),
          map(({ id }) => id || null)
        )
        .subscribe(entryId => {
          this._entryId = entryId;
          this._entryLiveWidget.activate({ entryId });
        });
    }
    
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
  
        this._registerWidgets();
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

      this._widgetsManager.register([
        this._liveUsers,
        this._liveBandwidth,
        this._liveStreamHealth,
        this._liveGeo,
        this._liveDevices,
        // <-- append new widgets here
      ], { entryId: this._entryId });
    }
  }
  
  public _navigateToEntry(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, '/content/entries/entry/' + this._entryId);
    }
  }
  
  public _back(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.EntryNavigateBack);
    } else {
      this._router.navigate(['audience/engagement'], { queryParams: this._route.snapshot.queryParams });
    }
  }
}
