import { Component, Input } from '@angular/core';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaStreamStatus } from '../../utils/get-stream-status';

@Component({
  selector: 'app-live-status',
  templateUrl: './live-status.component.html',
  styleUrls: ['./live-status.component.scss']
})
export class LiveStatusComponent {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._entry = value;
      this._isLive = value.streamState === KalturaStreamStatus.live;
    }
  }
  
  
  public _entry: KalturaExtendedLiveEntry;
  public _isLive = false;
  public _currentTime = 0;
}
