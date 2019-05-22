import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse, KalturaReportResponseOptions } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

export class LiveDiscoveryRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  constructor(private _entryId: string) {
  }
  
  public updateDateInterval(): void {
  
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest();
  }
}
