import { WidgetBase } from './widgets/widget-base';
import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetsActivationArgs } from './widgets/widgets-manager';
import { EntryLiveService, KalturaExtendedLiveEntry } from './entry-live.service';
import { EntryLiveRequestFactory } from './entry-live-request-factory';
import { KalturaStreamStatus } from './utils/get-stream-status';
import { KalturaAssetParamsOrigin, KalturaDVRStatus, KalturaMultiResponse, KalturaRecordStatus } from 'kaltura-ngx-client';
import { EntryLiveGeneralPollsService } from './providers/entry-live-general-polls.service';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';

@Injectable()
export class EntryLiveWidget extends WidgetBase<KalturaExtendedLiveEntry> {
  protected _widgetId = 'main';
  protected _pollsFactory = null;
  
  constructor(protected _serverPolls: EntryLiveGeneralPollsService,
              protected _frameEventManager: FrameEventManagerService,
              private _entryLiveService: EntryLiveService) {
    super(_serverPolls, _frameEventManager);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new EntryLiveRequestFactory(widgetsArgs.entryId, this._entryLiveService);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: KalturaMultiResponse): KalturaExtendedLiveEntry {
    const entry = responses[0].result;
    const profiles = responses[1].result.objects;
    const nodes = responses[2].result.objects;
    const liveEntry = Object.assign(entry, {
      dvr: entry.dvrStatus === KalturaDVRStatus.enabled,
      recording: entry.recordStatus !== KalturaRecordStatus.disabled,
      transcoding: !!profiles.find(({ origin }) => origin === KalturaAssetParamsOrigin.convert),
      redundancy: this._entryLiveService.getRedundancyStatus(nodes),
      streamStatus: KalturaStreamStatus.offline,
      serverType: null,
      owner: responses[3].result.fullName
    });
    
    this._entryLiveService.setStreamStatus(liveEntry, nodes);
    
    return liveEntry;
  }
}
