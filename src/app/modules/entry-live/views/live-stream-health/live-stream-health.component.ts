import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage, ScrollToTopContainerComponent } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import {DiagnosticsErrorCodes, LiveEntryDiagnosticsInfo, StreamHealth} from './live-stream-health.types';
import { LiveStreamHealthWidget } from './live-stream-health.widget';
import { filter } from 'rxjs/operators';
import { analyticsConfig } from "configuration/analytics-config";

@Component({
  selector: 'app-live-stream-health',
  templateUrl: './live-stream-health.component.html',
  styleUrls: ['./live-stream-health.component.scss']
})
export class LiveStreamHealthComponent implements OnInit, OnDestroy {
  private _selfServeAlertsBlacklist = [
    DiagnosticsErrorCodes.BitrateUnmatched,
    DiagnosticsErrorCodes.InvalidKeyFrameInterval,
    DiagnosticsErrorCodes.FrameRateIsDifferentThanConfigured,
    DiagnosticsErrorCodes.FrameRateIsFluctuatingOnFlavor
  ];

  private _selfServeChangedAlerts = [
    DiagnosticsErrorCodes.EntryRestarted,
    DiagnosticsErrorCodes.PtsDrift,
    DiagnosticsErrorCodes.BackupOnlyStreamRecording,
    DiagnosticsErrorCodes.AuthenticationInvalidToken,
    DiagnosticsErrorCodes.AuthenticationIncorrectStream,
    DiagnosticsErrorCodes.AuthenticationEntryNotFound
  ];

  private _isSelfServe = false;

  @ViewChild(ScrollToTopContainerComponent) _listContainer: ScrollToTopContainerComponent;
  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _data: StreamHealth[] = [];
  public _hideStatus = !analyticsConfig.viewsConfig.entryLive.status;

  constructor(private _liveStreamHealth: LiveStreamHealthWidget,
              private _errorsManager: ErrorsManagerService) {
  }

  ngOnInit() {
    this._liveStreamHealth.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._isBusy = true;
              this._blockerMessage = null;
              this._liveStreamHealth.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });

    this._liveStreamHealth.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: any) => {
        this._isBusy = false;
        this._data = this._parseData(data);
        if (this._listContainer) {
          this._listContainer.scrollToTop();
        }
      });
  }

  ngOnDestroy(): void {
  }

  private _parseData(response: LiveEntryDiagnosticsInfo): StreamHealth[] {
    const sortHealthNotifications = (a: StreamHealth, b: StreamHealth) => {
      if (a.updatedTime > b.updatedTime) {
        return -1;
      }
      if (a.updatedTime < b.updatedTime) {
        return 1;
      }
      return 0;
    };

    this._isSelfServe = response.selfServe && response.selfServe.data;
    let data = [...response.streamHealth.data.primary, ...response.streamHealth.data.secondary];

    if (this._isSelfServe) {
      data = data.filter(this._filterSelfServeNotifications.bind(this));
    }

    return data.sort(sortHealthNotifications);
  }

  private _filterSelfServeNotifications(notification) {
    // first filter all the alerts inside the notification
    notification.alerts = notification.alerts.filter(alert => {
      return this._selfServeAlertsBlacklist.indexOf(alert.Code) === -1;
    });

    // filter all notification with no alerts
    return notification.alerts.length > 0;
  }
}
