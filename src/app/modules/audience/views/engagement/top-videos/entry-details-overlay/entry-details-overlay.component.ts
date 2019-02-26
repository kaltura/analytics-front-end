import { Component, Input } from '@angular/core';
import {KalturaEntryStatus, KalturaMediaType} from 'kaltura-ngx-client';

export interface EntryDetailsOverlayData {
  object_id: string;
  entry_name: string;
  media_type: KalturaMediaType;
  creator_name: string;
  created_at: string;
  ms_duration: string;
  thumbnailUrl: string;
  status: KalturaEntryStatus;
}

@Component({
  selector: 'app-entry-details-overlay',
  templateUrl: './entry-details-overlay.component.html',
  styleUrls: ['./entry-details-overlay.component.scss'],
})
export class EntryDetailsOverlayComponent {
  @Input() entryData: EntryDetailsOverlayData;
}
