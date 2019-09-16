import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';

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
    
    const tooltipData = {
      played: Math.round(data.played / data.playerImpressions * 100),
      notPlayed: Math.round(data.notPlayed / data.playerImpressions * 100),
      completed: Math.round(data.completionRate100 / data.played * 100),
      between75to100: Math.round(data.completionRate75_100 / data.played * 100),
      between50to75: Math.round(data.completionRate50_75 / data.played * 100),
      between25to50: Math.round(data.completionRate25_50 / data.played * 100),
      under25: Math.round(data.completionRate0_25 / data.played * 100),
    };
    
    return {
      textStyle: {
        fontFamily: 'Lato',
      },
      tooltip: {
        formatter: params => {
          switch (params.name) {
            case 'playerImpressions':
              const impressionsHeader = `<div class="kTitle">${this._translate.instant('app.user.playerImpressions')}</div>`;
              const played = `<div class="kItem"><span class="kBullet" style="color: #88acf6">&bull;</span><span class="kValue">${tooltipData.played}%</span><span class="kLabel">${this._translate.instant('app.user.played')}</span></div>`;
              const notPlayed = `<div class="kItem"><span class="kBullet" style="color: #f3737b">&bull;</span><span class="kValue">${tooltipData.notPlayed}%</span><span class="kLabel">${this._translate.instant('app.user.notPlayed')}</span></div>`;
              return `<div class="kSankeyTooltip">${impressionsHeader}${played}${notPlayed}</div>`;
            case 'played':
              const playedHeader = `<div class="kTitle">${this._translate.instant('app.user.playedToCompletion')}</div>`;
              const completed = `<div class="kItem"><span class="kBullet" style="color: #6db35b">&bull;</span><span class="kValue">${tooltipData.completed}%</span><span class="kLabel">${this._translate.instant('app.user.completed')}</span></div>`;
              const between75to100 = `<div class="kItem"><span class="kBullet" style="color: #6DB25B">&bull;</span><span class="kValue">${tooltipData.between75to100}%</span><span class="kLabel">${this._translate.instant('app.user.between75to100')}</span></div>`;
              const between50to75 = `<div class="kItem"><span class="kBullet" style="color: #97de85">&bull;</span><span class="kValue">${tooltipData.between50to75}%</span><span class="kLabel">${this._translate.instant('app.user.between50to75')}</span></div>`;
              const between25to50 = `<div class="kItem"><span class="kBullet" style="color: #e1962e">&bull;</span><span class="kValue">${tooltipData.between25to50}%</span><span class="kLabel">${this._translate.instant('app.user.between25to50')}</span></div>`;
              const under25 = `<div class="kItem"><span class="kBullet" style="color: #f7c25c">&bull;</span><span class="kValue">${tooltipData.under25}%</span><span class="kLabel">${this._translate.instant('app.user.under25')}</span></div>`;
              return `<div class="kSankeyTooltip">${playedHeader}${completed}${between75to100}${between50to75}${between25to50}${under25}</div>`;
            case 'completionRate100':
              const completionRate100Header = `<div class="kTitle">${this._translate.instant('app.user.completionRate100')}</div>`;
              const completionRate100 = `<div class="kItem"><span class="kBullet" style="color: #6db35b">&bull;</span><span class="kValue">${tooltipData.completed}%</span><span class="kLabel">${this._translate.instant('app.user.fromAllImpressions')}</span></div>`;
              return `<div class="kSankeyTooltip">${completionRate100Header}${completionRate100}</div>`;
            case 'completionRate75_100':
              const completionRate75_100Header = `<div class="kTitle">${this._translate.instant('app.user.completionRate75_100')}</div>`;
              const completionRate75_100 = `<div class="kItem"><span class="kBullet" style="color: #6DB25B">&bull;</span><span class="kValue">${tooltipData.between75to100}%</span><span class="kLabel">${this._translate.instant('app.user.fromAllImpressions')}</span></div>`;
              return `<div class="kSankeyTooltip">${completionRate75_100Header}${completionRate75_100}</div>`;
            case 'completionRate50_75':
              const completionRate50_75Header = `<div class="kTitle">${this._translate.instant('app.user.completionRate50_75')}</div>`;
              const completionRate50_75 = `<div class="kItem"><span class="kBullet" style="color: #97de85">&bull;</span><span class="kValue">${tooltipData.between50to75}%</span><span class="kLabel">${this._translate.instant('app.user.fromAllImpressions')}</span></div>`;
              return `<div class="kSankeyTooltip">${completionRate50_75Header}${completionRate50_75}</div>`;
            case 'completionRate25_50':
              const completionRate25_50Header = `<div class="kTitle">${this._translate.instant('app.user.completionRate25_50')}</div>`;
              const completionRate25_50 = `<div class="kItem"><span class="kBullet" style="color: #e1962e">&bull;</span><span class="kValue">${tooltipData.between25to50}%</span><span class="kLabel">${this._translate.instant('app.user.fromAllImpressions')}</span></div>`;
              return `<div class="kSankeyTooltip">${completionRate25_50Header}${completionRate25_50}</div>`;
            case 'completionRate0_25':
              const completionRate25Header = `<div class="kTitle">${this._translate.instant('app.user.completionRate0_25')}</div>`;
              const completionRate25 = `<div class="kItem"><span class="kBullet" style="color: #f7c25c">&bull;</span><span class="kValue">${tooltipData.under25}%</span><span class="kLabel">${this._translate.instant('app.user.fromAllImpressions')}</span></div>`;
              return `<div class="kSankeyTooltip">${completionRate25Header}${completionRate25}</div>`;
          }
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
