import { Injectable } from '@angular/core';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';

@Injectable()
export class AuthService {

    constructor(private _frameEventManager: FrameEventManagerService) {
    }

    public logout(): void {
      this._frameEventManager.publish(FrameEvents.Logout);
    }

}

