import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';

export class LiveUsersRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  constructor(private _entryId: string) { // provide all needed parameters via factory constructor
    
  }
  
  create(): KalturaMultiRequest {
    // put multirequest here
    return null;
  }
}
