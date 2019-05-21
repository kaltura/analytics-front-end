import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveBandwidthRequestFactory } from './live-bandwidth-request-factory';
import { TranslateService } from '@ngx-translate/core';
import { EntryLiveGeneralPollsService } from '../../providers/entry-live-general-polls.service';
import { KalturaReportGraph } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

export interface LiveQoSData {
  bandwidth: number[];
  buffering: number[];
  dates: string[];
}

@Injectable()
export class LiveBandwidthWidget extends WidgetBase<LiveQoSData> {
  protected _widgetId = 'qos';
  protected _pollsFactory = null;
  
  constructor(protected _serverPolls: EntryLiveGeneralPollsService,
              private _translate: TranslateService) {
    super(_serverPolls);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveBandwidthRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(reports: KalturaReportGraph[]): LiveQoSData {
    this._pollsFactory.updateDateInterval();
    
    if (!reports.length) {
      return null;
    }
    
    let result = {
      buffering: [],
      bandwidth: [],
      dates: [],
    };
    
    const activeUsersData = reports.find(({ id }) => id === 'view_unique_audience');
    const bufferingUsersData = reports.find(({ id }) => id === 'view_unique_buffering_users');
    const bandwidthData = reports.find(({ id }) => id === 'avg_view_downstream_bandwidth');
  
    const getTime = dateString => {
      const rawTime = dateString.substring(8);
      const hours = rawTime.substring(0, 2);
      const minutes = rawTime.substring(2, 4);
      const seconds = rawTime.substring(4);
      return `${hours}:${minutes}:${seconds}`;
    };
    
    if (activeUsersData && bufferingUsersData) {
      const bufferingUsers = bufferingUsersData.data.split(';');
      activeUsersData.data.split(';')
        .filter(Boolean)
        .forEach((valueString, index) => {
          const [date, activeUsersRawValue] = valueString.split(analyticsConfig.valueSeparator);
          const [_, bufferingUsersRawValue] = bufferingUsers[index].split(analyticsConfig.valueSeparator);
          const activeUsersVal = Number(activeUsersRawValue);
          const bufferingUsersVal = Number(bufferingUsersRawValue);
          const bufferingValue = bufferingUsersVal ? (activeUsersVal / bufferingUsersVal).toFixed(1) : 0;
          result.buffering.push(bufferingValue);
          result.dates.push(getTime(date));
        });
    }
    
    if (bandwidthData) {
      bandwidthData.data.split(';')
        .filter(Boolean)
        .forEach(valueString => {
          const [_, value] = valueString.split(analyticsConfig.valueSeparator);
          result.bandwidth.push(value);
        });
    }
    
    return result;
  }
  
  public getGraphConfig(buffering: number[], bandwidth: number[]): { [key: string]: any } {
    return {
      color: ['#d48d2b', '#FBF4EB', '#e0313a', '#F4E1D9'],
      textStyle: {
        fontFamily: 'Lato',
      },
      grid: {
        top: 24, left: 0, bottom: 30, right: 0, containLabel: false
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#999999'
        },
        axisPointer: {
          animation: false
        },
        formatter: (params) => {
          const [active, engaged] = params;
          const title = active.axisValue;
          return `<div class="kLiveGraphTooltip"><span class="kHeader">${title}</span><div class="kUsers"><span class="kBullet" style="background-color: #d48d2b"></span>${this._translate.instant('app.entryLive.usersBuffering')}&nbsp;${active.data}%</div><div class="kUsers"><span class="kBullet" style="background-color: #e0313a"></span>${this._translate.instant('app.entryLive.downstreamBW')}&nbsp;${engaged.data} Kbps</div></div>`;
        }
      },
      xAxis: {
        boundaryGap: false,
        type: 'category',
        axisLine: {
          lineStyle: {
            color: '#ebebeb',
          },
        },
        axisLabel: {
          align: 'right',
          fontWeight: 'bold',
          color: '#999999',
          padding: [8, 0, 0, 0],
        }
      },
      yAxis: {
        show: false,
      },
      series: [
        {
          type: 'line',
          name: 'activeUsers',
          symbol: 'none',
          hoverAnimation: false,
          data: buffering,
          lineStyle: {
            color: '#d48d2b'
          },
          areaStyle: {
            color: '#FBF4EB',
          },
        },
        {
          type: 'line',
          name: 'engagedUsers',
          symbol: 'none',
          hoverAnimation: false,
          data: bandwidth,
          lineStyle: {
            color: '#e0313a'
          },
          areaStyle: {
            color: '#F4E1D9',
          },
        }
      ]
    };
  }
}
