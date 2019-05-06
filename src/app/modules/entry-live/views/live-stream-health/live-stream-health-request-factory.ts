import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';

export class LiveStreamHealthRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  constructor(private _entryId: string) {
    
  }
  
  create(): KalturaMultiRequest {
    return null;
  }
}
