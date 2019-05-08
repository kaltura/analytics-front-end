import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { BeaconListAction, KalturaBeaconFilter, KalturaBeaconIndexType, KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';
import * as moment from 'moment';

export enum BeaconObjectTypes {
  SCHEDULE_RESOURCE_BEACON = '1',
  ENTRY_SERVER_NODE_BEACON = '2',
  SERVER_NODE_BEACON = '3',
  ENTRY_BEACON = '4',
}

export class LiveStreamHealthRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private _filter = new KalturaBeaconFilter({
    orderBy: '-updatedAt',
    relatedObjectTypeIn: BeaconObjectTypes.ENTRY_BEACON,
    eventTypeIn: '0_healthData,1_healthData',
    objectIdIn: this._entryId,
    indexTypeEqual: KalturaBeaconIndexType.log
  });
  
  public set lastUpdateTime(value: number) {
    if (typeof value === 'number' && moment(value).isValid()) {
      this._filter.updatedAtGreaterThanOrEqual = new Date(value);
    }
  }

  constructor(private _entryId: string) {
    
  }
  
  create(): KalturaMultiRequest {
    return new KalturaMultiRequest(new BeaconListAction({ filter: this._filter }));
  }
}
