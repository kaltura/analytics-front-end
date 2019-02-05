import { Injectable } from '@angular/core';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Injectable()
export class AuthService {

    constructor(private _frameEventManager: FrameEventManagerService,
                private _logger: KalturaLogger) {
      this._logger = _logger.subLogger('AuthService');
    }

    public logout(): void {
      this._logger.info('Send logout event to the host app');
      this._frameEventManager.publish(FrameEvents.Logout);
    }

}

