import { WidgetBase } from './widgets/widget-base';
import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetsActivationArgs } from './widgets/widgets-manager';
import { EntryLiveService, KalturaExtendedLiveEntry } from './entry-live.service';
import { EntryLiveRequestFactory } from './entry-live-request-factory';
import { KalturaStreamStatus } from './utils/get-stream-status';
import {
  KalturaAssetParamsOrigin,
  KalturaDVRStatus,
  KalturaMultiResponse,
  KalturaRecordingStatus,
  KalturaRecordStatus,
  KalturaSourceType
} from 'kaltura-ngx-client';
import { EntryLiveGeneralPollsService } from './providers/entry-live-general-polls.service';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from "configuration/analytics-config";

@Injectable()
export class EntryLiveWidget extends WidgetBase<KalturaExtendedLiveEntry> {
  protected _widgetId = 'main';
  protected _pollsFactory = null;

  constructor(protected _serverPolls: EntryLiveGeneralPollsService,
              protected _frameEventManager: FrameEventManagerService,
              private _entryLiveService: EntryLiveService) {
    super(_serverPolls, _frameEventManager);
  }

  protected _onRestart(): void {
    this._pollsFactory = new EntryLiveRequestFactory(this._activationArgs.entryId, this._entryLiveService);
  }

  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new EntryLiveRequestFactory(widgetsArgs.entryId, this._entryLiveService);

    return ObservableOf(null);
  }

  protected _responseMapping(responses: KalturaMultiResponse): KalturaExtendedLiveEntry {
    const showStatus = analyticsConfig.viewsConfig.entryLive.status;
    const entry = responses[0].result;
    const profiles = showStatus ? responses[2].result.objects : [];
    const nodes = showStatus ? responses[3].result.objects : [];
    const liveEntry = Object.assign(entry, {
      dvr: entry.dvrStatus === KalturaDVRStatus.enabled,
      recording: entry.recordingStatus === KalturaRecordingStatus.active && entry.recordStatus !== KalturaRecordStatus.disabled,
      transcoding: !!profiles.find(({ origin }) => origin === KalturaAssetParamsOrigin.convert),
      redundancy: this._entryLiveService.getRedundancyStatus(nodes),
      streamStatus: KalturaStreamStatus.offline,
      serverType: null,
      owner: responses[1].result.fullName,
      isManual: entry.sourceType === KalturaSourceType.manualLiveStream,
      displayCreatedAt: DateFilterUtils.formatFullDateString(entry.createdAt),
    });

    if (showStatus) {
      this._entryLiveService.setStreamStatus(liveEntry, nodes);
    } else {
      const isLive = responses[2].result;
      liveEntry.streamStatus = isLive ? KalturaStreamStatus.live : KalturaStreamStatus.offline;
    }

    return liveEntry;
  }
}
