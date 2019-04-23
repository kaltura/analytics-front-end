import { Component, Input } from '@angular/core';
import { KalturaExtendedLiveEntry } from '../../entry-live-view.component';

@Component({
  selector: 'app-live-status',
  templateUrl: './live-status.component.html',
  styleUrls: ['./live-status.component.scss']
})
export class LiveStatusComponent {
  @Input() entry: KalturaExtendedLiveEntry;

  public _isLive = false;
  public _currentTime = 0;
}
