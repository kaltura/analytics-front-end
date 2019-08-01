import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';

@Injectable()
export class UserImpressionsDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'count_loads': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays_25': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays_50': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays_75': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'count_plays_100': {
            format: value => ReportHelper.numberOrNA(value)
          }
        }
      }
    };
  }
  
  public getChartConfig(totals: { [key: string]: number }): EChartOption {
    const data = {
      playerImpressions: totals['count_loads'],
      played: totals['count_plays'],
      notPlayed: totals['count_loads'] - totals['count_plays'],
      completionRate100: totals['count_plays_100'],
      completionRate0_25: totals['count_plays_25'],
      completionRate25_50: Math.abs(totals['count_plays_25'] - totals['count_plays_50']),
      completionRate50_75: Math.abs(totals['count_plays_50'] - totals['count_plays_75']),
      completionRate75_100: Math.abs(totals['count_plays_75'] - totals['count_plays_100']),
    };
    
    return {
      textStyle: {
        fontFamily: 'Lato',
      },
      tooltip: {
        formatter: params => {
          console.warn(params);
        },
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#999999',
        },
        axisPointer: {
          lineStyle: {
            color: '#dadada',
          },
          z: 0,
        },
      },
      series: {
        type: 'sankey',
        draggable: false,
        focusNodeAdjacency: 'allEdges',
        nodeGap: 25,
        left: '24px',
        right: '24px',
        nodeWidth: 8,
        label: {
          fontSize: 15,
          formatter: ({ name }) => `{bold|${data[name]}} ${this._translate.instant('app.user.' + name)}`,
          rich: {
            bold: {
              fontSize: 15,
              fontWeight: 'bold'
            }
          }
        },
        lineStyle: {
          normal: {
            color: '#EBEBEB',
            opacity: 1,
          }
        },
        data: [
          {
            name: 'playerImpressions',
            itemStyle: {
              color: '#487ADF',
              borderWidth: 0,
              
            },
            label: {
              position: 'insideTopLeft',
              offset: [10, 0]
            }
          },
          {
            name: 'played',
            itemStyle: {
              color: '#88ACF6',
              borderWidth: 0,
            },
            label: {
              position: 'insideTopLeft',
              offset: [10, 0]
            }
          },
          {
            name: 'notPlayed',
            itemStyle: {
              color: '#F3737B',
              borderWidth: 0,
            },
            label: {
              position: 'insideTopRight',
              offset: [-10, 0],
            }
          },
          {
            name: 'completionRate100',
            itemStyle: {
              color: '#6DB25B',
              borderWidth: 0,
            },
            label: {
              position: 'insideTopRight',
              offset: [-10, 0],
            },
          },
          {
            name: 'completionRate75_100',
            itemStyle: {
              color: '#6DB25B',
              borderWidth: 0,
            },
            label: {
              position: 'insideTopRight',
              offset: [-10, 0],
            },
          },
          {
            name: 'completionRate50_75',
            itemStyle: {
              color: '#98DE85',
              borderWidth: 0,
            },
            label: {
              position: 'insideTopRight',
              offset: [-10, 0],
            },
          },
          {
            name: 'completionRate25_50',
            itemStyle: {
              color: '#E1952E',
              borderWidth: 0,
            },
            label: {
              position: 'insideTopRight',
              offset: [-10, 0],
            },
          },
          {
            name: 'completionRate0_25',
            itemStyle: {
              color: '#F7C25C',
              borderWidth: 0,
            },
            label: {
              position: 'insideTopRight',
              offset: [-10, 0],
            },
          },
        ],
        links: [
          {
            source: 'playerImpressions',
            target: 'played',
            value: data.played,
          },
          {
            source: 'playerImpressions',
            target: 'notPlayed',
            value: data.notPlayed,
          },
          {
            source: 'played',
            target: 'completionRate100',
            value: data.completionRate100,
          },
          {
            source: 'played',
            target: 'completionRate75_100',
            value: data.completionRate75_100,
          },
          {
            source: 'played',
            target: 'completionRate50_75',
            value: data.completionRate50_75,
          },
          {
            source: 'played',
            target: 'completionRate25_50',
            value: data.completionRate25_50,
          },
          {
            source: 'played',
            target: 'completionRate0_25',
            value: data.completionRate0_25,
          },
        ]
      }
    };
  }
}
