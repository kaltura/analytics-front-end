import { WidgetBase } from './widgets/widget-base';
import { Observable, of } from 'rxjs';
import { AnalyticsServerPolls } from 'shared/services/server-polls.service';
import { Injectable } from '@angular/core';
import { KalturaClient } from 'kaltura-ngx-client';
import { WidgetsActivationArgs } from './widgets/widgets-manager';
import { KalturaExtendedLiveEntry } from './entry-live.service';

@Injectable()
export class EntryLiveWidget extends WidgetBase<KalturaExtendedLiveEntry> {
  protected _widgetId = 'main';
  protected _pollsFactory = null;
  
  constructor(protected _serverPolls: AnalyticsServerPolls,
              private _kalturaClient: KalturaClient) {
    super(_serverPolls);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    return of();
  }
}
