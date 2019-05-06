import { Observable, of as ObservableOf } from 'rxjs';
import { AnalyticsServerPolls } from 'shared/services/server-polls.service';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveUsersRequestFactory } from './live-users-request-factory';
import { KalturaReportGraph } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';

export interface LiveUsersData {
  watchers: number;
}

@Injectable()
export class LiveUsersWidget extends WidgetBase<LiveUsersData> {
  protected _widgetId = 'users';
  protected _pollsFactory = null;
  
  constructor(protected _serverPolls: AnalyticsServerPolls,
              private _translate: TranslateService) {
    super(_serverPolls);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveUsersRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  public getGraphConfig(activeUsers: number[], engagedUsers: number[]): { [key: string]: any } {
    return {
      color: ['#60BBA7', '#EDF8F6', '#367064', '#D9EBE8'],
      textStyle: {
        fontFamily: 'Lato',
      },
      grid: {
        top: 24, left: 0, bottom: 24, right: 0, containLabel: true
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
          const title = active.dataIndex === 17
            ? this._translate.instant('app.entryLive.now')
            : this._translate.instant('app.entryLive.ms', [190 - ((active.dataIndex + 1) * 10)]);
          
          return `<div class="kLiveGraphTooltip"><span class="kHeader">${title}</span><div class="kUsers"><span class="kBullet" style="background-color: #60BBA7"></span>${this._translate.instant('app.entryLive.activeUsers')}&nbsp;${active.data}</div><div class="kUsers"><span class="kBullet" style="background-color: #367064"></span>${this._translate.instant('app.entryLive.engagedUsers')}&nbsp;${engaged.data}%</div></div>`;
        }
      },
      xAxis: {
        boundaryGap: false,
        type: 'category',
        data: [
          this._translate.instant('app.entryLive.m180s'),
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          this._translate.instant('app.entryLive.now')
        ],
        splitLine: {
          show: false
        },
        axisTick: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(0, 0, 0, 0)',
          },
        },
        axisLabel: {
          color: '#999999',
          padding: [8, 10, 0, 0],
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
          data: activeUsers,
          lineStyle: {
            color: '#60BBA7'
          },
          areaStyle: {
            color: '#EDF8F6',
          },
        },
        {
          type: 'line',
          name: 'engagedUsers',
          symbol: 'none',
          hoverAnimation: false,
          data: engagedUsers,
          lineStyle: {
            color: '#367064'
          },
          areaStyle: {
            color: '#D9EBE8',
          },
        }
      ]
    };
  }
}
