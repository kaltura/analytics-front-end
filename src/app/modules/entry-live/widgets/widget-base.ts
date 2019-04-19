import { BehaviorSubject, Observable, of, Unsubscribable } from 'rxjs';
import { AnalyticsServerPolls } from 'shared/services/server-polls.service';
import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaRequest } from 'kaltura-ngx-client';
import { catchError, map } from 'rxjs/operators';

export abstract class WidgetBase<T> {
  protected _isActive: boolean;
  protected _isRunning: boolean;
  protected _pollingSubscription: Unsubscribable;
  protected _state = new BehaviorSubject<T>(null);
  
  protected abstract _widgetId: string;
  
  protected abstract _pollsFactory: RequestFactory<KalturaRequest<any>, T>;
  
  protected abstract _onActivate(): Observable<void>;
  
  protected constructor(protected _serverPolls: AnalyticsServerPolls) {
  }
  
  protected _onDeactivate(): void {
    // empty by design
  }
  
  public startPolling(): any {
    if (!this._isRunning) {
      this._isRunning = true;
      
      this._pollingSubscription = this._serverPolls.register<T>(10, this._pollsFactory)
        .subscribe((response) => {
          if (response.error) {
            // TODO handle error
            return;
          }
          
          this._state.next(response.result);
        });
    }
  }
  
  public activate(): Observable<{ id: string, result: boolean, error?: Error }> {
    return this._onActivate()
      .pipe(
        map(() => {
          this._isActive = true;
          this.startPolling();
          return { id: this._widgetId, result: true };
        }),
        catchError((error) => {
          return of({ id: this._widgetId, result: false, error });
        })
      );
  }
  
  public deactivate(): void {
    this._isRunning = false;
    
    if (this._pollingSubscription) {
      this._pollingSubscription.unsubscribe();
      this._pollingSubscription = null;
    }
    
    this._onDeactivate();
  }
}
