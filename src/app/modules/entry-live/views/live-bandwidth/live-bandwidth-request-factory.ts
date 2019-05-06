import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaLiveReportInputFilter, KalturaLiveReportType, KalturaMultiRequest, KalturaMultiResponse, KalturaNullableBoolean, LiveReportsGetEventsAction } from 'kaltura-ngx-client';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';

export class LiveBandwidthRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  constructor(private _entryId: string) {
    
  }
  
  create(): KalturaMultiRequest {
    return null;
  }
}
