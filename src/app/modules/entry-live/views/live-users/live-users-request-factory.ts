import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaLiveReportInputFilter, KalturaLiveReportType, KalturaMultiRequest, KalturaMultiResponse, KalturaNullableBoolean, LiveReportsGetEventsAction } from 'kaltura-ngx-client';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';

export class LiveUsersRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  constructor(private _entryId: string) { // provide all needed parameters via factory constructor
    
  }
  
  create(): KalturaMultiRequest {
    const usersCountAction = new LiveReportsGetEventsAction({
      reportType: KalturaLiveReportType.entryTimeLine,
      filter: new KalturaLiveReportInputFilter({
        entryIds: this._entryId,
        fromTime: moment().subtract(180, 'seconds').toDate(),
        toTime: moment().toDate(),
        live: KalturaNullableBoolean.trueValue,
      })
    });
    return new KalturaMultiRequest(usersCountAction);
  }
}
