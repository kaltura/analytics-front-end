import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';

@Component({
  selector: 'app-entry-details',
  templateUrl: './entry-details.component.html',
  styleUrls: ['./entry-details.component.scss']
})
export class EntryDetailsComponent {
  @Input() entry: KalturaExtendedLiveEntry;
  @Input() showOwner: boolean;

  @Output() navigateToEntry = new EventEmitter<void>();
}
