import { Injectable } from '@angular/core';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient } from "kaltura-ngx-client";

@Injectable()
export class AuthService {

    public set ks(value: string) {
      this._ks = value;
    }
    public get ks(): string {
      return this._ks;
    }

    public set pid(value: string) {
      this._pid = value;
    }
    public get pid(): string {
      return this._pid;
    }

    private _ks: string = null; // current ks
    private _parentKs = null;   // parent ks for multi account
    private _pid = null;        // current partner id
    private _parentPid = null;  // parent partner id for multi account

    constructor(private _frameEventManager: FrameEventManagerService,
                private _kalturaServerClient: KalturaClient,
                private _logger: KalturaLogger) {
      this._logger = _logger.subLogger('AuthService');
    }

    public logout(): void {
      this._logger.info('Send logout event to the host app');
      this._frameEventManager.publish(FrameEvents.Logout);
    }

    public restoreParentIfNeeded(): void {
      if (this._parentPid) {
        this._pid = this._parentPid;
        this._parentPid = null;
      }

      if (this._parentKs) {
        this._ks = this._parentKs;
        this._parentKs = null;

        // update Kaltura client lib ks
        this._kalturaServerClient.setDefaultRequestOptions({
          ks: this._ks
        });
      }
    }


}

