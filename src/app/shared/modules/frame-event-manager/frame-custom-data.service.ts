import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Injectable()
export class FrameCustomDataService implements OnDestroy {
  private _data = new BehaviorSubject<any>(null);
  
  public readonly data$ = this._data.asObservable();
  
  constructor(private _frameEventManager: FrameEventManagerService) {
    _frameEventManager
      .listen(FrameEvents.CustomData)
      .pipe(cancelOnDestroy(this))
      .subscribe(data => this._data.next(data));
  }
  
  ngOnDestroy(): void {
    this._data.complete();
  }
}
