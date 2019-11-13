import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig, EntryLiveUsersMode } from 'configuration/analytics-config';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ToggleUsersModeService implements OnDestroy {
  private _mode = new BehaviorSubject<EntryLiveUsersMode>(EntryLiveUsersMode[analyticsConfig.liveEntryUsersReports]);
  
  public readonly usersMode$ = this._mode.asObservable();
  
  public get usersMode(): EntryLiveUsersMode {
    return this._mode.getValue();
  }
  
  constructor(private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService) {
  }
  
  ngOnDestroy(): void {
    this._mode.complete();
  }
  
  public changeMode(value: EntryLiveUsersMode): void {
    analyticsConfig.liveEntryUsersReports = value;
    
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.UpdateAuthLiveUsersReports, value);
    }
  
    this._mode.next(value);
  }
}
