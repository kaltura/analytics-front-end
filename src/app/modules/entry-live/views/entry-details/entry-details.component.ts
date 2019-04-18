import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KalturaDVRStatus, KalturaLiveEntry, KalturaRecordingStatus } from 'kaltura-ngx-client';

@Component({
  selector: 'app-entry-details',
  templateUrl: './entry-details.component.html',
  styleUrls: ['./entry-details.component.scss']
})
export class EntryDetailsComponent {
  @Input() entry: KalturaLiveEntry;

  @Output() navigateToEntry = new EventEmitter<void>();
  
  public _dvrStatus = KalturaDVRStatus;
  public _recordingStatus = KalturaRecordingStatus;
}
