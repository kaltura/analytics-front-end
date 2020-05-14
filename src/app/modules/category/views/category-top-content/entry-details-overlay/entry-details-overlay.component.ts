import { Component, Input } from '@angular/core';
import {KalturaEntryStatus, KalturaMediaType} from 'kaltura-ngx-client';

export interface EntryDetailsOverlayData {
  object_id: string;
  entry_name: string;
  media_type: KalturaMediaType;
  duration_msecs: string;
  entry_source: any;
  thumbnailUrl: string;
  status: KalturaEntryStatus;
  created_at: string;
}

@Component({
  selector: 'app-category-entry-details-overlay',
  templateUrl: './entry-details-overlay.component.html',
  styleUrls: ['./entry-details-overlay.component.scss'],
})
export class CategoryEntryDetailsOverlayComponent {
  @Input() entryData: EntryDetailsOverlayData;
}
