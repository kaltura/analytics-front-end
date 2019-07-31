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
    const played = totals['count_plays'];
    const notPlayed = totals['count_loads'] - played;
    const played100 = totals['count_plays_100'];
    const played25 = totals['count_plays_25'];
    const played25_50 = Math.abs(totals['count_plays_25'] - totals['count_plays_50']);
    const played50_75 = Math.abs(totals['count_plays_50'] - totals['count_plays_75']);
    const played75_100 = Math.abs(totals['count_plays_75'] - totals['count_plays_100']);
    
    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove'
      },
      series: {
        type: 'sankey',
        draggable: false,
        focusNodeAdjacency: 'allEdges',
        nodeGap: 25,
        data: [
          {
            name: this._translate.instant('app.user.playerImpressions'),
            itemStyle: {
              color: '#487ADF',
              borderWidth: 0,
            }
          },
          {
            name: this._translate.instant('app.user.played'),
            itemStyle: {
              color: '#88ACF6',
              borderWidth: 0,
            }
          },
          {
            name: this._translate.instant('app.user.notPlayed'),
            itemStyle: {
              color: '#F3737B',
              borderWidth: 0,
            }
          },
          {
            name: this._translate.instant('app.user.completionRate100'),
            itemStyle: {
              color: '#6DB25B',
              borderWidth: 0,
            },
            label: {
              position: 'left'
            },
          },
          {
            name: this._translate.instant('app.user.completionRate75_100'),
            itemStyle: {
              color: '#6DB25B',
              borderWidth: 0,
            },
            label: {
              position: 'left'
            },
          },
          {
            name: this._translate.instant('app.user.completionRate50_75'),
            itemStyle: {
              color: '#98DE85',
              borderWidth: 0,
            },
            label: {
              position: 'left'
            },
          },
          {
            name: this._translate.instant('app.user.completionRate25_50'),
            itemStyle: {
              color: '#E1952E',
              borderWidth: 0,
            },
            label: {
              position: 'left'
            },
          },
          {
            name: this._translate.instant('app.user.completionRate0_25'),
            itemStyle: {
              color: '#F7C25C',
              borderWidth: 0,
            },
            label: {
              position: 'left'
            },
          },
        ],
        links: [
          {
            source: this._translate.instant('app.user.playerImpressions'),
            target: this._translate.instant('app.user.played'),
            value: played,
          },
          {
            source: this._translate.instant('app.user.playerImpressions'),
            target: this._translate.instant('app.user.notPlayed'),
            value: notPlayed,
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate100'),
            value: played100,
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate75_100'),
            value: played75_100,
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate50_75'),
            value: played50_75,
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate25_50'),
            value: played25_50,
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate0_25'),
            value: played25,
          },
        ]
      }
    };
  }
}
