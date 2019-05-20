import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveUsersRequestFactory } from './live-users-request-factory';
import { EntryLiveGeneralPollsService } from '../../providers/entry-live-general-polls.service';
import { KalturaReportGraph } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';

export interface LiveUsersData {
  activeUsers: number[];
  engagedUsers: number[];
  dates: string[];
}

@Injectable()
export class LiveUsersWidget extends WidgetBase<LiveUsersData> {
  protected _widgetId = 'users';
  protected _pollsFactory: LiveUsersRequestFactory = null;
  
  constructor(protected _serverPolls: EntryLiveGeneralPollsService) {
    super(_serverPolls);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveUsersRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(reports: KalturaReportGraph[]): LiveUsersData {
    this._pollsFactory.updateDateInterval();
    
    if (!reports.length) {
      return null;
    }
    
    let result = {
      activeUsers: [],
      engagedUsers: [],
      dates: [],
    };
    
    const activeUsersData = reports.find(({ id }) => id === 'view_unique_audience');
    const engagedUsersData = reports.find(({ id }) => id === 'view_unique_engaged_users');
    const getDate = dateString => {
    
    };
    
    if (activeUsersData) {
      activeUsersData.data.split(';')
        .filter(Boolean)
        .forEach(valueString => {
          const [date, value] = valueString.split(analyticsConfig.valueSeparator);
          result.activeUsers.push(Number(value));
          result.dates.push(date);
        });
    }
    
    if (engagedUsersData) {
      engagedUsersData.data.split(';')
        .filter(Boolean)
        .forEach((valueString, index) => {
          const [date, rawValue] = valueString.split(analyticsConfig.valueSeparator);
          const relevantActiveUser = activeUsersData[index] || 0;
          const value = relevantActiveUser ? Math.round(Number(rawValue) / relevantActiveUser * 100) : 0;
          result.engagedUsers.push(value);
        });
    }
    
    return result;
  }
}
