import { Observable, of as ObservableOf } from 'rxjs';
import { AnalyticsServerPolls } from 'shared/services/server-polls.service';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveUsersRequestFactory } from './live-users-request-factory';

@Injectable()
export class LiveUsersWidget extends WidgetBase<any> { // instead of any use target type of the data
  protected _widgetId = 'users';
  protected _pollsFactory = null;
  
  constructor(protected _serverPolls: AnalyticsServerPolls) {
    super(_serverPolls);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveUsersRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(responses: any): any { // map response here if needed, result type should correspond to `WidgetBase<TYPE>`
    return responses;
  }
}
