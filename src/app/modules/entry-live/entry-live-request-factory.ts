import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';
import { EntryLiveService } from './entry-live.service';

export class EntryLiveRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  constructor(private _entryId: string,
              private _entryLiveService: EntryLiveService,
              private loadOwner = true) {

  }

  create(): KalturaMultiRequest {
    return this._entryLiveService.getEntryDateRequest(this._entryId, this.loadOwner);
  }
}
