import { Injectable } from '@angular/core';
import {
  ConversionProfileAssetParamsListAction,
  EntryServerNodeListAction,
  KalturaConversionProfileAssetParamsFilter,
  KalturaDetachedResponseProfile,
  KalturaEntryServerNode,
  KalturaEntryServerNodeStatus,
  KalturaEntryServerNodeType,
  KalturaLiveEntry,
  KalturaLiveEntryServerNodeFilter, KalturaMultiRequest,
  KalturaRequestOptions,
  KalturaResponseProfileType,
  LiveStreamGetAction,
  UserGetAction
} from 'kaltura-ngx-client';
import { getStreamStatus, KalturaStreamStatus } from './utils/get-stream-status';

export interface KalturaExtendedLiveEntry extends KalturaLiveEntry {
  dvr: boolean;
  recording: boolean;
  transcoding: boolean;
  redundancy: boolean;
  serverType: KalturaEntryServerNodeType;
  streamStatus: KalturaStreamStatus;
  owner: string;
  displayCreatedAt: string;
}

@Injectable()
export class EntryLiveService {
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
  
  private _getConversionProfileAssetParamsListAction(): ConversionProfileAssetParamsListAction {
    return new ConversionProfileAssetParamsListAction({
      filter: new KalturaConversionProfileAssetParamsFilter({ conversionProfileIdEqual: 0 })
        .setDependency(['conversionProfileIdEqual', 0, 'conversionProfileId'])
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
    let result: { status: KalturaStreamStatus, serverType: KalturaEntryServerNodeType } = {
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


  private _getUserAction(): UserGetAction {
    return new UserGetAction({ userId: null })
      .setRequestOptions(
        new KalturaRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'id,fullName'
          })
        })
      );
  }
  
  public getEntryDateRequest(entryId): KalturaMultiRequest {
    return new KalturaMultiRequest(
      this._getLiveStreamAction(entryId),
      this._getConversionProfileAssetParamsListAction(),
      this._getEntryServerNodeListAction(entryId),
      this._getUserAction().setDependency(['userId', 0, 'userId'])
    );
  }
}
