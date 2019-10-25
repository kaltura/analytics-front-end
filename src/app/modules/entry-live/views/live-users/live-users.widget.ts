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
import { EntryLiveUsersMode } from 'shared/utils/live-report-type-map';
import { ToggleUsersModeService } from '../../components/toggle-users-mode/toggle-users-mode.service';

export interface GraphPoint {
  value: number;
  symbol?: string;
  symbolSize?: number;
  itemStyle?: { color: string };
}

export interface LiveUsersData {
  activeUsers: GraphPoint[];
  currentActiveUsers: string;
  engagedUsers: GraphPoint[];
  currentEngagedUsers: string;
  dates: string[];
}

@Injectable()
export class LiveUsersWidget extends WidgetBase<LiveUsersData> {
  protected _widgetId = 'users';
  protected _pollsFactory: LiveUsersRequestFactory = null;
  
  constructor(protected _serverPolls: EntryLiveGeneralPollsService,
              protected _frameEventManager: FrameEventManagerService,
              protected _translate: TranslateService,
              protected _usersModeService: ToggleUsersModeService) {
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
    
    const activeUsersKey = this._usersModeService.usersMode === EntryLiveUsersMode.All
      ? 'views'
      : 'view_unique_audience';
    const engagedUsersKey = this._usersModeService.usersMode === EntryLiveUsersMode.All
      ? 'avg_view_engagement'
      : 'view_unique_engaged_users';
    const activeUsersData = reports.find(({ id }) => id === activeUsersKey);
    const engagedUsersData = reports.find(({ id }) => id === engagedUsersKey);
    
    if (activeUsersData) {
      activeUsersData.data.split(';')
        .filter(Boolean)
        .forEach((valueString, index, array) => {
          const [date, value] = valueString.split(analyticsConfig.valueSeparator);
          result.dates.push(DateFilterUtils.getTimeStringFromEpoch(date));
          
          const graphPoint = { value: Number(value) };
          if (index === array.length - 1) {
            graphPoint['symbol'] = 'circle';
            graphPoint['symbolSize'] = 8;
            graphPoint['itemStyle'] = { color: '#60BBA7' };
          }
          result.activeUsers.push(graphPoint);
        });
    }
    
    if (engagedUsersData) {
      engagedUsersData.data.split(';')
        .filter(Boolean)
        .forEach((valueString, index, array) => {
          const [date, rawValue] = valueString.split(analyticsConfig.valueSeparator);
          const relevantActiveUser = result.activeUsers[index] ? result.activeUsers[index].value || 0 : 0;
          
          const value = relevantActiveUser ? Number(rawValue) / relevantActiveUser * 100 : 0;
          
          const graphPoint = { value };
          if (index === array.length - 1) {
            graphPoint['symbol'] = 'circle';
            graphPoint['symbolSize'] = 8;
            graphPoint['itemStyle'] = { color: '#367064' };
          }
          result.engagedUsers.push(graphPoint);
        });
    }
    
    return {
      ...result,
      currentActiveUsers: result.activeUsers.length ? ReportHelper.numberOrZero([...result.activeUsers].pop().value) : '0',
      currentEngagedUsers: result.engagedUsers.length ? ReportHelper.percents([...result.engagedUsers].pop().value / 100, false, false) : '0%',
    };
  }
  
  public getGraphConfig(activeUsers: GraphPoint[], engagedUsers: GraphPoint[]): EChartOption {
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
          const activeValue = ReportHelper.numberOrZero(active.data.value);
          const engagedValue = ReportHelper.percents(engaged.data.value / 100, false, false);
          return `<div class="kLiveGraphTooltip"><span class="kHeader">${title}</span><div class="kUsers"><span class="kBullet" style="background-color: #60BBA7"></span>${this._translate.instant('app.entryLive.activeUsers')}:&nbsp;${activeValue}</div><div class="kUsers"><span class="kBullet" style="background-color: #367064"></span>${this._translate.instant('app.entryLive.engagedUsers')}:&nbsp;${engagedValue}</div></div>`;
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
        boundaryGap: true,
        type: 'category',
        axisLine: {
          lineStyle: {
            color: '#ebebeb',
          },
        },
        axisLabel: {
          align: 'center',
          fontWeight: 'bold',
          color: '#999999',
          padding: [8, 0, 0, 24],
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
