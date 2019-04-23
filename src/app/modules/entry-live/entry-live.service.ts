import { Injectable } from '@angular/core';
import {
  ConversionProfileAssetParamsListAction,
  EntryServerNodeListAction,
  KalturaAssetParamsOrigin,
  KalturaClient,
  KalturaConversionProfileAssetParamsFilter,
  KalturaDetachedResponseProfile,
  KalturaDVRStatus,
  KalturaEntryServerNode,
  KalturaEntryServerNodeStatus,
  KalturaEntryServerNodeType,
  KalturaLiveEntry,
  KalturaLiveEntryServerNodeFilter,
  KalturaRecordStatus,
  KalturaRequestOptions,
  KalturaResponseProfileType,
  LiveStreamGetAction
} from 'kaltura-ngx-client';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { getStreamStatus, KalturaStreamStatus } from './utils/get-stream-status';

export interface KalturaExtendedLiveEntry extends KalturaLiveEntry {
  dvr: boolean;
  recording: boolean;
  transcoding: boolean;
  redundancy: boolean;
  serverType: KalturaEntryServerNodeType;
  streamStatus: KalturaStreamStatus;
}

@Injectable()
export class EntryLiveService {
  
  constructor(private _kalturaClient: KalturaClient) {
  }
  
  private _getLiveStreamAction(entryId): LiveStreamGetAction {
    return new LiveStreamGetAction({ entryId })
      .setRequestOptions(
        new KalturaRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'id,name,dvrStatus,recordStatus,currentBroadcastStartTime,mediaType,createdAt,creatorId,conversionProfileId,explicitLive,viewMode'
          })
        })
      );
  }
  
  private _getConversionProfileAssetParamsListAction(conversionProfileIdEqual: number): ConversionProfileAssetParamsListAction {
    return new ConversionProfileAssetParamsListAction({
      filter: new KalturaConversionProfileAssetParamsFilter({ conversionProfileIdEqual })
    }).setRequestOptions(
      new KalturaRequestOptions({
        responseProfile: new KalturaDetachedResponseProfile({ type: KalturaResponseProfileType.includeFields, fields: 'id,origin,currentBroadcastStartTime' })
      })
    );
  }
  
  private _getEntryServerNodeListAction(entryIdEqual: string): EntryServerNodeListAction {
    return new EntryServerNodeListAction({ filter: new KalturaLiveEntryServerNodeFilter({ entryIdEqual }) });
  }
  
  public getRedundancyStatus(serverNodeList: KalturaEntryServerNode[]): boolean {
    if (serverNodeList.length > 1) {
      return serverNodeList.every(sn => sn.status !== KalturaEntryServerNodeStatus.markedForDeletion);
    }
    return false;
  }
  
  // Possible scenarios for streamStatus:
  // (1) If only primary -> StreamStatus equals primary status
  // (2) If only secondary -> StreamStatus equals secondary status
  // (3) If both -> StreamStatus equals the same as recent active
  public setStreamStatus(liveEntry: KalturaExtendedLiveEntry, serverNodeList: KalturaEntryServerNode[]): void {
    const viewMode = liveEntry.explicitLive ? liveEntry.viewMode : null;
    let result = {
      status: getStreamStatus(KalturaEntryServerNodeStatus.stopped),
      serverType: null,
    };
    
    if (liveEntry.redundancy) {
      if (!liveEntry.serverType || (KalturaEntryServerNodeType.livePrimary === liveEntry.serverType)) {
        result = {
          status: getStreamStatus(serverNodeList[0].status, viewMode),
          serverType: KalturaEntryServerNodeType.livePrimary,
        };
      } else if (KalturaEntryServerNodeType.liveBackup === liveEntry.serverType) {
        result = {
          status: getStreamStatus(serverNodeList[1].status, viewMode),
          serverType: KalturaEntryServerNodeType.liveBackup,
        };
      }
    } else {
      if (serverNodeList.length) {
        const sn = serverNodeList.find(esn => esn.status !== KalturaEntryServerNodeStatus.markedForDeletion);
        if (sn) {
          result = {
            status: getStreamStatus(sn.status, viewMode),
            serverType: sn.serverType,
          };
        }
      }
    }
  
    liveEntry.streamStatus = result.status;
    liveEntry.serverType = result.serverType;
  }
  
  public getEntryData(entryId: string): Observable<KalturaExtendedLiveEntry> {
    return this._kalturaClient.request(this._getLiveStreamAction(entryId))
      .pipe(
        switchMap(entry =>
          this._kalturaClient.request(this._getConversionProfileAssetParamsListAction(entry.conversionProfileId))
            .pipe(map(profilesRes => ({ profiles: profilesRes.objects, entry })))
        ),
        switchMap(response =>
          this._kalturaClient.request(this._getEntryServerNodeListAction(entryId))
            .pipe(map(nodesRes => ({ ...response, nodes: nodesRes.objects })))
        ),
        map(({ profiles, entry, nodes }) => {
          const liveEntry = Object.assign(entry, {
            dvr: entry.dvrStatus === KalturaDVRStatus.enabled,
            recording: entry.recordStatus !== KalturaRecordStatus.disabled,
            transcoding: !!profiles.find(({ origin }) => origin === KalturaAssetParamsOrigin.convert),
            redundancy: this.getRedundancyStatus(nodes),
            streamStatus: KalturaStreamStatus.offline,
            serverType: null,
          });
  
          this.setStreamStatus(liveEntry, nodes);
          
          return liveEntry;
        })
      );
  }
}
