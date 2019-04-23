import { BehaviorSubject, Observable, of, Unsubscribable } from 'rxjs';
import { AnalyticsServerPolls } from 'shared/services/server-polls.service';
import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaAPIException, KalturaRequest } from 'kaltura-ngx-client';
import { catchError, map } from 'rxjs/operators';
import { WidgetsActivationArgs } from './widgets-manager';

export interface WidgetState {
  polling?: boolean;
  activated?: boolean;
  error?: KalturaAPIException | Error;
}

export abstract class WidgetBase<T> {
  protected _pollingSubscription: Unsubscribable;
  protected _data = new BehaviorSubject<T>(null);
  protected _state = new BehaviorSubject<WidgetState>({ polling: false, activated: false });
  
  protected abstract _widgetId: string;
  
  protected abstract _pollsFactory: RequestFactory<KalturaRequest<any>, T>;
  
  protected abstract _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void>;
  
  protected constructor(protected _serverPolls: AnalyticsServerPolls) {
  }
  
  protected _updateState(newState: WidgetState): void {
    const currentState = this._state.getValue();
    this._state.next({ ...currentState, ...newState });
  }
  
  protected _stopPolling(error = null): void {
    this._updateState({ polling: false, error });

    if (this._pollingSubscription) {
      this._pollingSubscription.unsubscribe();
      this._pollingSubscription = null;
    }
  }
  
  protected _onDeactivate(): void {
    // empty by design
  }
  
  public startPolling(): any {
    const currentState = this._state.getValue();
    if (!currentState.polling) {
      this._updateState({ polling: true });
      
      this._pollingSubscription = this._serverPolls.register<T>(10, this._pollsFactory)
        .subscribe((response) => {
          if (response.error) {
            this._stopPolling(response.error);
            return;
          }
          
          this._data.next(response.result);
        });
    }
  }
  
  public activate(widgetsArgs: WidgetsActivationArgs): Observable<{ id: string, result: boolean, error?: Error }> {
    return this._onActivate(widgetsArgs)
      .pipe(
        map(() => {
          this._updateState({ activated: true, error: null });
          this.startPolling();
          return { id: this._widgetId, result: true };
        }),
        catchError((error) => {
          this._updateState({ activated: false, error });
          return of({ id: this._widgetId, result: false, error });
        })
      );
  }
  
  public deactivate(): void {
    this._updateState({ activated: false, error: null });
  
    this._stopPolling();
    
    this._onDeactivate();
  }
}
