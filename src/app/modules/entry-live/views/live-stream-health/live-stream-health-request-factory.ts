import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { BeaconListAction, KalturaBeaconFilter, KalturaBeaconIndexType, KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';

export enum BeaconObjectTypes {
  SCHEDULE_RESOURCE_BEACON = '1',
  ENTRY_SERVER_NODE_BEACON = '2',
  SERVER_NODE_BEACON = '3',
  ENTRY_BEACON = '4',
}

export class LiveStreamHealthRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  public lastUpdateTime: number;
  constructor(private _entryId: string) {
    
  }
  
  create(): KalturaMultiRequest {
    const filter = new KalturaBeaconFilter({
      orderBy: '-updatedAt',
      relatedObjectTypeIn: BeaconObjectTypes.ENTRY_BEACON,
      eventTypeIn: '0_healthData,1_healthData',
      objectIdIn: this._entryId,
      indexTypeEqual: KalturaBeaconIndexType.log
    });
    
    if (this.lastUpdateTime) {
      filter.updatedAtGreaterThanOrEqual = new Date(this.lastUpdateTime);
    }

    return new KalturaMultiRequest(new BeaconListAction({ filter }));
  }
}
