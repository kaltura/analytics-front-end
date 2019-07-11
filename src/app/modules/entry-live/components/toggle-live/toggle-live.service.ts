import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient, KalturaLiveStreamEntry, KalturaRecordingStatus, KalturaViewMode, LiveStreamUpdateAction } from 'kaltura-ngx-client';
import { Subject } from 'rxjs';
import { BrowserService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { KalturaExtendedLiveEntry } from '../../entry-live.service';

@Injectable()
export class ToggleLiveService implements OnDestroy {
  private _updatedEntry = new Subject<KalturaExtendedLiveEntry>();
  private _isBusy = new Subject<boolean>();
  
  public readonly updatedEntry$ = this._updatedEntry.asObservable();
  public readonly isBusy$ = this._isBusy.asObservable();
  
  constructor(private _browserService: BrowserService,
              private _kalturaClient: KalturaClient,
              private _translation: TranslateService) {
  }
  
  ngOnDestroy(): void {
    this._updatedEntry.complete();
    this._isBusy.complete();
  }
  
  private _updatePreviewMode(entry: KalturaExtendedLiveEntry, viewMode: KalturaViewMode, recordingStatus: KalturaRecordingStatus): void {
    this._kalturaClient.request(
      new LiveStreamUpdateAction({
        entryId: entry.id,
        liveStreamEntry: new KalturaLiveStreamEntry({ viewMode, recordingStatus })
      })
    )
      .subscribe(
        ({ viewMode, recordingStatus }) => {
          entry.viewMode = viewMode;
          entry.recordingStatus = recordingStatus;
          
          this._updatedEntry.next(entry);
        },
        error => {
          this._browserService.alert({ message: error.message });
          this._updatedEntry.next(entry);
          this._isBusy.next(false);
        });
  }
  
  public toggle(entry: KalturaExtendedLiveEntry): void {
    this._isBusy.next(true);
    if (entry.viewMode === KalturaViewMode.preview) {
      this._updatePreviewMode(entry, KalturaViewMode.allowAll, KalturaRecordingStatus.active);
    } else {
      this._browserService.confirm(
        {
          header: this._translation.instant('app.entryLive.endLiveHeader'),
          message: this._translation.instant('app.entryLive.endLiveMessage'),
          acceptLabel: this._translation.instant('app.entryLive.endLive'),
          accept: () => {
            this._updatePreviewMode(entry, KalturaViewMode.preview, KalturaRecordingStatus.stopped);
          },
          reject: () => this._isBusy.next(false)
        });
    }
  }
}
