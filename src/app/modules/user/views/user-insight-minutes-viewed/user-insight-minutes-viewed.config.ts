import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { EChartOption } from 'echarts';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import { ReportHelper } from 'shared/services';
import { TrendService } from 'shared/services/trend.service';
import { TrendPipe } from 'shared/pipes/trend.pipe';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';

@Injectable()
export class UserInsightMinutesViewedConfig extends ReportDataBaseConfig {
  private _trendIcon = new TrendPipe();
  
  constructor(_translate: TranslateService,
              private _trendService: TrendService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'date_id': {
            format: value => DateFilterUtils.parseDateString(value),
          },
          'sum_time_viewed': {
            format: value => parseFloat(value),
          },
        }
      },
    };
  }
  
  public getGraphConfig(current: number[], compare: number[] = null): EChartOption {
    return {
      color: [getPrimaryColor('time'), getSecondaryColor('time')],
      textStyle: { fontFamily: 'Lato' },
      grid: {
        top: 24, left: 10, bottom: 30, right: 12, containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: { color: '#999999' },
        confine: true,
        axisPointer: {
          type: compare ? 'shadow' : 'none',
          shadowStyle: {
            color: 'rgba(150,150,150,0.1)'
          }
        },
        formatter: params => {
          if (params.length > 1) {
            const { value, direction } = this._trendService.calculateTrend(params[0].data, params[1].data);
            const icon = this._trendIcon.transform(direction);
            
            return `<div class="kGraphTooltip" style="display: flex; align-items: center"><div><span class="kBullet" style="color: ${getPrimaryColor('time')}">&bull;</span>&nbsp;<span style="font-weight: bold; color: #333333">${this._translate.instant('app.user.minutesViewed', [params[0].data])}</span><br><span class="kBullet" style="color: ${getSecondaryColor('time')}">&bull;</span>&nbsp;<span style="font-weight: bold; color: #333333">${this._translate.instant('app.user.minutesViewed', [params[1].data])}</span></div><span class="kTrend" style="margin-left: 8px"><i class="${icon}"></i><span>${value !== null ? value + '%' : '–'}</span></span></div>`;
          }
          
          return `<div class="kGraphTooltip"><span class="kBullet" style="color: ${getPrimaryColor('time')}">&bull;</span>&nbsp;<span style="font-weight: bold; color: #333333">${this._translate.instant('app.user.minutesViewed', [params[0].data])}</span></div>`;
        }
      },
      xAxis: {
        type: 'category',
        data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontWeight: 'bold',
          fontSize: 12,
          color: '#999999'
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          data: current,
          type: 'bar',
          barMaxWidth: '34px',
          barMinWidth: '16px',
          itemStyle: {
            barBorderRadius: 2
          },
          markLine: !compare ? {
            animation: false,
            symbol: false,
            lineStyle: {
              color: '#ce5e19',
              width: 1,
              emphasis: {
                width: 1
              }
            },
            label: {
              show: true,
              textBorderColor: '#ffffff',
              textBorderWidth: 1,
              position: 'middle',
              color: '#333333',
              formatter: params => this._translate.instant('app.user.dailyAvgViews', [ReportHelper.numberOrZero(params.value)]),
            },
            data: [{ type: 'average' }]
          } : null,
        },
        compare ? {
          data: compare,
          type: 'bar',
          barMaxWidth: '34px',
          barMinWidth: '16px',
          itemStyle: {
            barBorderRadius: 2
          }
        } : null
      ].filter(Boolean)
    };
  }
}
