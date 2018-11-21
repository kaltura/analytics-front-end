import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

export enum FrameEvents {
  UpdateLayout = 'updateLayout',
  Logout = 'logout',
  Init = 'init',
  AnalyticsInit = 'analytics-init',
  AnalyticsInitComplete = 'analytics-init-complete',
  Navigate = 'navigate',
}

@Injectable()
export class FrameEventManagerService implements OnDestroy {
  private _parentEvents = new Subject<{ event: FrameEvents, payload: any }>();
  private _targetOrigin = '*';
  private _ready = false;
  
  constructor() {
    this._windowEventListener = this._windowEventListener.bind(this);
  }
  
  
  ngOnDestroy(): void {
    window.removeEventListener('message', this._windowEventListener);
    this._parentEvents.complete();
  }
  
  private _windowEventListener(event: any): void {
    let postMessageData;
    try {
      postMessageData = event.data;
    } catch (ex) {
      return;
    }
    this._parentEvents.next({ event: postMessageData.messageType, payload: postMessageData.payload });
  }
  
  private _subscribeToParentEvents(): void {
    window.addEventListener('message', this._windowEventListener);
  }
  
  private _listenEvent(eventName: FrameEvents, once = false): Observable<any> {
    const chain = [
      filter(({ event }) => event === eventName),
      map(({ payload }) => payload),
    ];
    
    if (once) {
      chain.push(first());
    }
    return this._parentEvents
      .asObservable()
      .pipe(...chain);
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
    return this._listenEvent(eventName);
  }
  
  public once(eventName: FrameEvents): Observable<any> {
    return this._listenEvent(eventName, true);
  }
}
