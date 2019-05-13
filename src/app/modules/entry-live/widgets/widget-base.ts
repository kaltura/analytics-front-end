import { BehaviorSubject, Observable, Unsubscribable } from 'rxjs';
import { AnalyticsServerPolls } from 'shared/services/server-polls.service';
import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaAPIException, KalturaRequest } from 'kaltura-ngx-client';
import { WidgetsActivationArgs } from './widgets-manager';
import { analyticsConfig } from 'configuration/analytics-config';

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
  
  protected abstract _pollsFactory: RequestFactory<KalturaRequest<any>, T>;
  
  protected abstract _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void>;
  
  protected constructor(protected _serverPolls: AnalyticsServerPolls) {
  }
  
  protected _updateState(newState: WidgetState): void {
    this._state.next({ ...this._currentState, ...newState });
  }
  
  protected _stopPolling(error = null): void {
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
    if (!this._currentState.polling && this._pollsFactory) {
      this._updateState({ polling: true });
      
      this._pollingSubscription = this._serverPolls.register<T>(analyticsConfig.live.pollInterval, this._pollsFactory)
        .subscribe((response) => {
          if (response.error) {
            this._stopPolling(response.error);
            return;
          }
          
          const data = this._responseMapping(response.result);
          this._data.next(data);
        });
    }
  }
  
  public activate(widgetsArgs: WidgetsActivationArgs): void {
    if (this._currentState.activated) {
      return;
    }
  
    this._activationArgs = widgetsArgs;
    
    this._onActivate(widgetsArgs)
      .subscribe(
        () => {
          this._updateState({ activated: true, error: null });
          this.startPolling();
        }, error => {
          this._updateState({ activated: false, error });
        });
  }
  
  public deactivate(): void {
    this._updateState({ activated: false, error: null });
    
    this._stopPolling();
    
    this._onDeactivate();
  }
  
  public retry(): void {
    this.activate(this._activationArgs);
  }
}
