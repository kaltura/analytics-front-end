import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { BeaconListAction, KalturaBeaconFilter, KalturaBeaconIndexType, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';
import * as moment from 'moment';
import { analyticsConfig } from 'configuration/analytics-config';

export enum BeaconObjectTypes {
  SCHEDULE_RESOURCE_BEACON = '1',
  ENTRY_SERVER_NODE_BEACON = '2',
  SERVER_NODE_BEACON = '3',
  ENTRY_BEACON = '4',
}

export class LiveStreamHealthRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private _beaconListArgs = {
    filter: new KalturaBeaconFilter({
      orderBy: '-updatedAt',
      relatedObjectTypeIn: BeaconObjectTypes.ENTRY_BEACON,
      eventTypeIn: '0_healthData,1_healthData,selfServeStats',
      objectIdIn: this._entryId,
      indexTypeEqual: KalturaBeaconIndexType.log
    }),
    pager: new KalturaFilterPager({ pageSize: analyticsConfig.live.healthNotificationsCount }),
  };

  public set lastUpdateTime(value: number) {
    if (typeof value === 'number' && moment(value).isValid()) {
      this._beaconListArgs.filter.updatedAtGreaterThanOrEqual = Math.floor(value / 1000);
    }
  }

  constructor(private _entryId: string) {

  }

  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(new BeaconListAction(this._beaconListArgs));
  }

  public removePager(): void {
    if (this._beaconListArgs.pager) {
      delete this._beaconListArgs.pager;
    }
  }
}
