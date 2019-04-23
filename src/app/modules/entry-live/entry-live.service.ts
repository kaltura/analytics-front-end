import { Injectable } from '@angular/core';
import {
  ConversionProfileAssetParamsListAction,
  EntryServerNodeListAction,
  KalturaClient,
  KalturaConversionProfileAssetParams,
  KalturaConversionProfileAssetParamsFilter,
  KalturaDetachedResponseProfile,
  KalturaEntryServerNode,
  KalturaLiveEntry,
  KalturaLiveEntryServerNodeFilter,
  KalturaRequestOptions,
  KalturaResponseProfileType,
  LiveStreamGetAction
} from 'kaltura-ngx-client';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

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
            fields: 'id,name,dvrStatus,recordStatus,currentBroadcastStartTime,mediaType,createdAt,creatorId,conversionProfileId'
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
  
  public getEntryData(entryId: string): Observable<{ entry: KalturaLiveEntry, profiles: KalturaConversionProfileAssetParams[], nodes: KalturaEntryServerNode[] }> {
    return this._kalturaClient.request(this._getLiveStreamAction(entryId))
      .pipe(
        switchMap(entry =>
          this._kalturaClient.request(this._getConversionProfileAssetParamsListAction(entry.conversionProfileId))
            .pipe(map(profilesRes => ({ profiles: profilesRes.objects, entry })))
        ),
        switchMap(response =>
          this._kalturaClient.request(this._getEntryServerNodeListAction(entryId))
            .pipe(map(nodesRes => ({ ...response, nodes: nodesRes.objects })))
        )
      );
  }
}
