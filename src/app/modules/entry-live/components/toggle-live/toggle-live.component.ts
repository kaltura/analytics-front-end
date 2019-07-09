import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { ToggleLiveService } from './toggle-live.service';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';
import { KalturaViewMode } from 'kaltura-ngx-client';
import { KalturaStreamStatus } from '../../utils/get-stream-status';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-toggle-live-btn',
  templateUrl: './toggle-live.component.html',
  styleUrls: ['./toggle-live.component.scss'],
  providers: [ToggleLiveService],
})
export class ToggleLiveComponent implements OnDestroy {
  @Input() set entry(value: KalturaExtendedLiveEntry) {
    if (value) {
      this._entry = value;
      this._canToggle = [KalturaStreamStatus.live, KalturaStreamStatus.preview].indexOf(value.streamStatus) !== -1;
      this._isPreview = value.viewMode === KalturaViewMode.preview;
    }
  }
  
  @Output() entryToggled = new EventEmitter<KalturaExtendedLiveEntry>();
  
  private _entry: KalturaExtendedLiveEntry;
  
  public _isPreview = false;
  public _canToggle = false;
  
  constructor(private _toggleLiveService: ToggleLiveService) {
    this._toggleLiveService.updatedEntry$
      .pipe(cancelOnDestroy(this))
      .subscribe(entry => {
        this.entryToggled.emit(entry);
      });
  }
  
  ngOnDestroy(): void {
  }
  
  public _toggleViewMode(): void {
    this._canToggle = false;
    this._toggleLiveService.toggle(this._entry);
  }
}
