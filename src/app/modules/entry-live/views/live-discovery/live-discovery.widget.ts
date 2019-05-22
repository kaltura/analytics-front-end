import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveDiscoveryRequestFactory } from './live-discovery-request-factory';
import { KalturaReportGraph } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { EntryLiveDiscoveryPollsService } from '../../providers/entry-live-discovery-polls.service';

export interface LiveUsersData {
  activeUsers: number[];
  engagedUsers: number[];
  dates: string[];
}

@Injectable()
export class LiveDiscoveryWidget extends WidgetBase<any> {
  protected _widgetId = 'explore';
  protected _pollsFactory: LiveDiscoveryRequestFactory = null;
  
  constructor(protected _serverPolls: EntryLiveDiscoveryPollsService,
              protected _translate: TranslateService) {
    super(_serverPolls);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveDiscoveryRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(reports: KalturaReportGraph[]): any {
    this._pollsFactory.updateDateInterval();
    
  }
}
