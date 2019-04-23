import { Component, Input, OnDestroy } from '@angular/core';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaStreamStatus } from '../../utils/get-stream-status';
import { timer as ObservableTimer } from 'rxjs';
import * as moment from 'moment';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-live-status',
  templateUrl: './live-status.component.html',
  styleUrls: ['./live-status.component.scss']
})
export class LiveStatusComponent implements OnDestroy {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._entry = value;
      this._isLive = value.streamStatus !== KalturaStreamStatus.offline;
      
      this._startTicking();
    }
  }
  
  
  public _entry: KalturaExtendedLiveEntry;
  public _isLive = false;
  public _streamDuration: moment.Duration;
  
  ngOnDestroy(): void {
  }
  
  private _startTicking(): void {
    ObservableTimer(0, 1000)
      .pipe(
        cancelOnDestroy(this),
        filter(() => this._entry.streamStatus !== KalturaStreamStatus.offline)
      )
      .subscribe(() => {
        this._streamDuration = this._entry.currentBroadcastStartTime
          ? moment.duration(Math.abs(moment().diff(DateFilterUtils.getMomentDate(this._entry.currentBroadcastStartTime))))
          : moment.duration(0);
      });
  }
}
