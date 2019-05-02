import { Component, OnDestroy, OnInit } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaClient, KalturaLiveEntry } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter, map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ErrorsManagerService } from 'shared/services';
import { EntryLiveService, KalturaExtendedLiveEntry } from './entry-live.service';
import { WidgetsManager } from './widgets/widgets-manager';
import { EntryLiveWidget } from './entry-live.widget';

@Component({
  selector: 'app-entry-live',
  templateUrl: './entry-live-view.component.html',
  styleUrls: ['./entry-live-view.component.scss'],
})
export class EntryLiveViewComponent implements OnInit, OnDestroy {
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
              private _entryLiveWidget: EntryLiveWidget) {
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
          this._entryLiveWidget.activate({ entryId: this._entryId });
        });
    } else {
      this._route.params
        .pipe(
          cancelOnDestroy(this),
          map(({ id }) => id || null)
        )
        .subscribe(entryId => {
          this._entryId = entryId;
          this._entryLiveWidget.activate({ entryId: this._entryId });
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
              this._entryLiveWidget.activate({ entryId: this._entryId });
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
  
    this._entryLiveWidget.data$
      .pipe(cancelOnDestroy(this))
      .subscribe(data => {
        this._isBusy = false;
        this._entry = data;
      });
  }
  
  ngOnDestroy() {
    this._entryLiveWidget.deactivate();
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
