import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KalturaDVRStatus, KalturaRecordingStatus } from 'kaltura-ngx-client';
import { KalturaExtendedLiveEntry } from '../../entry-live-view.component';

@Component({
  selector: 'app-entry-details',
  templateUrl: './entry-details.component.html',
  styleUrls: ['./entry-details.component.scss']
})
export class EntryDetailsComponent {
  @Input() entry: KalturaExtendedLiveEntry;
  
  @Output() navigateToEntry = new EventEmitter<void>();
}
