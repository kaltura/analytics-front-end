import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';

export enum FrameEvents {
  UpdateLayout = 'updateLayout',
  Logout = 'logout',
  Init = 'init',
  AnalyticsInit = 'analytics-init',
  AnalyticsInitComplete = 'analytics-init-complete',
  Navigate = 'navigate',
  UpdateFilters = 'updateFilters',
  ScrollTo = 'scrollTo',
}

@Injectable()
export class FrameEventManagerService implements OnDestroy {
  private _parentEvents: { [key: string]: BehaviorSubject<{ payload: any }> } = {};
  private _targetOrigin = '*';
  private _ready = false;
  
  constructor() {
    this._windowEventListener = this._windowEventListener.bind(this);
  }
  
  
  ngOnDestroy(): void {
    window.removeEventListener('message', this._windowEventListener);
    Object.values(this._parentEvents).forEach(event => event.complete());
  }
  
  private _windowEventListener(event: any): void {
    let postMessageData;
    try {
      postMessageData = event.data;
    } catch (ex) {
      return;
    }
    
    this._createEventCacheIfNeeded(postMessageData.messageType);

    this._parentEvents[postMessageData.messageType].next({ payload: postMessageData.payload });
  }
  
  private _createEventCacheIfNeeded(eventName: FrameEvents): void {
    if (!this._parentEvents.hasOwnProperty(eventName)) {
      this._parentEvents[eventName] = new BehaviorSubject({ payload: null });
    }
  }
  
  private _subscribeToParentEvents(): void {
    window.addEventListener('message', this._windowEventListener);
  }
  
  public init(): void {
    if (this._ready) {
      return;
    }
    
    this._ready = true;
    this._subscribeToParentEvents();
  }
  
  public publish(event: FrameEvents, payload?: any): void {
    const message = { 'messageType': event };
    
    if (payload) {
      message['payload'] = payload;
    }
    
    window.parent.postMessage(message, this._targetOrigin);
  }
  
  public listen(eventName: FrameEvents): Observable<any> {
    this._createEventCacheIfNeeded(eventName);
    
    return this._parentEvents[eventName]
      .asObservable()
      .pipe(map(({ payload }) => payload));
  }
}
