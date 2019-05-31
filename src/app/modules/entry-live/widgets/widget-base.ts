import { BehaviorSubject, Observable, Unsubscribable } from 'rxjs';
import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaAPIException, KalturaMultiRequest, KalturaRequest } from 'kaltura-ngx-client';
import { WidgetsActivationArgs } from './widgets-manager';
import { analyticsConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { AnalyticsServerPollsBase, OnPollTickSuccess } from 'shared/services/server-polls-base.service';

export interface WidgetState {
  polling?: boolean;
  activated?: boolean;
  error?: KalturaAPIException;
}

export abstract class WidgetBase<T> {
  protected _pollingSubscription: Unsubscribable;
  protected _data = new BehaviorSubject<T>(null);
  protected _state = new BehaviorSubject<WidgetState>({ polling: false, activated: false });
  protected _activationArgs: WidgetsActivationArgs;
  
  protected get _currentData(): T {
    return this._data.getValue();
  }
  
  protected get _currentState(): WidgetState {
    return this._state.getValue();
  }
  
  public data$ = this._data.asObservable();
  public state$ = this._state.asObservable();
  
  protected abstract _widgetId: string;
  
  protected abstract _pollsFactory: RequestFactory<KalturaRequest<any> | KalturaMultiRequest, T> & OnPollTickSuccess;
  
  protected abstract _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void>;
  
  protected constructor(protected _serverPolls: AnalyticsServerPollsBase,
                        protected _frameEventManager: FrameEventManagerService) {
  }
  
  protected _canStartPolling(): boolean {
    return true;
  }
  
  protected _updateState(newState: WidgetState): void {
    this._state.next({ ...this._currentState, ...newState });
  }
  
  public stopPolling(error = null): void {
    this._updateState({ polling: false, error });
    
    if (this._pollingSubscription) {
      this._pollingSubscription.unsubscribe();
      this._pollingSubscription = null;
    }
  }
  
  protected _responseMapping(responses: any): T {
    return responses;
  }
  
  protected _onDeactivate(): void {
    // empty by design
  }
  
  public startPolling(): void {
    if (!this._currentState.polling && this._pollsFactory && this._canStartPolling()) {
      this._updateState({ polling: true });
      
      this._pollingSubscription = this._serverPolls.register<T>(analyticsConfig.live.pollInterval, this._pollsFactory)
        .subscribe((response) => {
          this.updateLayout();

          if (response.error) {
            this.stopPolling(response.error);
            return;
          }
          
          const data = this._responseMapping(response.result);
          this._data.next(data);
  
          if (typeof this._pollsFactory.onPollTickSuccess === 'function') {
            this._pollsFactory.onPollTickSuccess();
          }
        });
    }
  }
  
  public restartPolling(): void {
    this.stopPolling();
    this.startPolling();
  }
  
  public activate(widgetsArgs: WidgetsActivationArgs, silent = false): void {
    if (this._currentState.activated) {
      return;
    }
    
    this._activationArgs = widgetsArgs;
    
    this._onActivate(widgetsArgs)
      .subscribe(
        () => {
          this._updateState({ activated: true, error: null });
          
          if (!silent) {
            this.startPolling();
          }
        }, error => {
          this._updateState({ activated: false, error });
        });
  }
  
  public deactivate(): void {
    this._updateState({ activated: false, error: null });
    
    this.stopPolling();
    
    this._onDeactivate();
  }
  
  public retry(): void {
    this.activate(this._activationArgs);
  }
  
  public updateLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        const height = document.getElementById('analyticsApp').getBoundingClientRect().height;
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height });
      }, 0);
    }
  }
}
