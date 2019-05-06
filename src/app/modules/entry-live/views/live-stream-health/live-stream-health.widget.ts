import { Observable, of as ObservableOf } from 'rxjs';
import { AnalyticsServerPolls } from 'shared/services/server-polls.service';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveStreamHealthRequestFactory } from './live-stream-health-request-factory';
import { TranslateService } from '@ngx-translate/core';

export interface LiveUsersData {
  watchers: number;
}

@Injectable()
export class LiveStreamHealthWidget extends WidgetBase<LiveUsersData> {
  protected _widgetId = 'users';
  protected _pollsFactory = null;
  
  constructor(protected _serverPolls: AnalyticsServerPolls,
              private _translate: TranslateService) {
    super(_serverPolls);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveStreamHealthRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
}
