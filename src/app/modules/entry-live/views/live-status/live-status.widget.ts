import { WidgetBase } from '../../widgets/widget-base';
import { Observable } from 'rxjs';
import { AnalyticsServerPolls } from 'shared/services/server-polls.service';
import { Injectable } from '@angular/core';
import { KalturaClient, KalturaDetachedResponseProfile, KalturaResponseProfileType, LiveStreamGetAction } from 'kaltura-ngx-client';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { map } from 'rxjs/operators';

@Injectable()
export class LiveStatusWidget extends WidgetBase<any> {
  protected _widgetId = 'live-status';
  protected _pollsFactory = null;
  
  constructor(protected _serverPolls: AnalyticsServerPolls,
              private _kalturaClient: KalturaClient) {
    super(_serverPolls);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    return this._kalturaClient
      .request(
        new LiveStreamGetAction({ entryId: widgetsArgs.entryId })
          .setRequestOptions({
            responseProfile: new KalturaDetachedResponseProfile({
              type: KalturaResponseProfileType.includeFields,
              fields: 'currentBroadcastStartTime'
            })
          }),
      )
      .pipe(map(() => null));
  }
}
