import { Component, Input, OnDestroy } from '@angular/core';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaStreamStatus } from '../../utils/get-stream-status';
import { timer as ObservableTimer, Unsubscribable } from 'rxjs';
import * as moment from 'moment';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { filter } from 'rxjs/operators';
import { KalturaSourceType } from "kaltura-ngx-client";

@Component({
  selector: 'app-live-status',
  templateUrl: './live-status.component.html',
  styleUrls: ['./live-status.component.scss']
})
export class LiveStatusComponent implements OnDestroy {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._entry = value;
      this._isPreview = KalturaStreamStatus.preview === value.streamStatus;
      this._initializing = KalturaStreamStatus.initializing === value.streamStatus;
      this._isManual = value.sourceType === KalturaSourceType.manualLiveStream;
      // manual live will get the isLive status from the player as we currently don't support it in the backend
      if (!this._isManual) {
        this._isLive = [KalturaStreamStatus.offline, KalturaStreamStatus.initializing, KalturaStreamStatus.preview].indexOf(value.streamStatus) === -1;
        if (this._isLive) {
          this._startTimer();
        } else {
          this._stopTimer();
        }
      }
    }
  }

  @Input() set manualLiveOnline(isLive: boolean) {
    if (this._isManual) {
      this._isLive = isLive;
    }
  }

  private _timer: Unsubscribable;

  public _entry: KalturaExtendedLiveEntry;
  public _isLive = false;
  public _isManual = false;
  public _isPreview = false;
  public _initializing = false;
  public _streamDuration: moment.Duration;

  ngOnDestroy(): void {
  }

  private _startTimer(): void {
    if (!this._timer) { // prevent unnecessary restart
      this._timer = ObservableTimer(0, 1000)
        .pipe(
          cancelOnDestroy(this),
          filter(() => this._isLive && !!this._entry.currentBroadcastStartTime)
        )
        .subscribe(() => {
          this._streamDuration = moment.duration(Math.abs(moment().diff(DateFilterUtils.getMomentDate(this._entry.currentBroadcastStartTime))));
        });
    }
  }

  private _stopTimer(): void {
    if (this._timer) {
      this._timer.unsubscribe();
      this._timer = null;
      this._streamDuration = moment.duration(0);
    }
  }
}
