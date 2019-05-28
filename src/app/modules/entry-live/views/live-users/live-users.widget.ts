import { Observable, of as ObservableOf } from 'rxjs';
import { Injectable } from '@angular/core';
import { WidgetBase } from '../../widgets/widget-base';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';
import { LiveUsersRequestFactory } from './live-users-request-factory';
import { EntryLiveGeneralPollsService } from '../../providers/entry-live-general-polls.service';
import { KalturaReportGraph } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { EChartOption } from 'echarts';
import { TranslateService } from '@ngx-translate/core';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { ReportHelper } from 'shared/services';

export interface LiveUsersData {
  activeUsers: number[];
  currentActiveUsers: string;
  engagedUsers: number[];
  currentEngagedUsers: string;
  dates: string[];
}

@Injectable()
export class LiveUsersWidget extends WidgetBase<LiveUsersData> {
  protected _widgetId = 'users';
  protected _pollsFactory: LiveUsersRequestFactory = null;
  
  constructor(protected _serverPolls: EntryLiveGeneralPollsService,
              protected _frameEventManager: FrameEventManagerService,
              protected _translate: TranslateService) {
    super(_serverPolls, _frameEventManager);
  }
  
  protected _onActivate(widgetsArgs: WidgetsActivationArgs): Observable<void> {
    this._pollsFactory = new LiveUsersRequestFactory(widgetsArgs.entryId);
    
    return ObservableOf(null);
  }
  
  protected _responseMapping(reports: KalturaReportGraph[]): LiveUsersData {
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
    
    if (activeUsersData) {
      activeUsersData.data.split(';')
        .filter(Boolean)
        .forEach(valueString => {
          const [date, value] = valueString.split(analyticsConfig.valueSeparator);
          result.activeUsers.push(Number(value));
          result.dates.push(DateFilterUtils.getTimeStringFromEpoch(date));
        });
    }
    
    if (engagedUsersData) {
      engagedUsersData.data.split(';')
        .filter(Boolean)
        .forEach((valueString, index) => {
          const [date, rawValue] = valueString.split(analyticsConfig.valueSeparator);
          const relevantActiveUser = result.activeUsers[index] || 0;
          const value = relevantActiveUser ? Number(rawValue) / relevantActiveUser * 100 : 0;
          result.engagedUsers.push(value);
        });
    }
  
    return {
      ...result,
      currentActiveUsers: ReportHelper.numberOrZero([...result.activeUsers].pop()),
      currentEngagedUsers: ReportHelper.percents([...result.engagedUsers].pop() / 100, false, false),
    };
  }
  
  public getGraphConfig(activeUsers: number[], engagedUsers: number[]): EChartOption {
    return {
      color: ['#60BBA7', '#EDF8F6', '#367064', '#D9EBE8'],
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
          const activeValue = ReportHelper.numberOrZero(active.data);
          const engagedValue = ReportHelper.percents(engaged.data / 100, false, false);
          return `<div class="kLiveGraphTooltip"><span class="kHeader">${title}</span><div class="kUsers"><span class="kBullet" style="background-color: #60BBA7"></span>${this._translate.instant('app.entryLive.activeUsers')}&nbsp;${activeValue}</div><div class="kUsers"><span class="kBullet" style="background-color: #367064"></span>${this._translate.instant('app.entryLive.engagedUsers')}&nbsp;${engagedValue}</div></div>`;
        }
      },
      yAxis: [
        {
          show: false,
          name: 'activeUsers',
          nameTextStyle: { color: 'rgba(0, 0, 0, 0)' },
          max: 'dataMax',
        },
        {
          show: false,
          name: 'engagedUsers',
          nameTextStyle: { color: 'rgba(0, 0, 0, 0)' },
          max: 100,
        },
      ],
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
          yAxisIndex: 1,
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
