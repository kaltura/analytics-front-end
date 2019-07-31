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
  
  public getChartConfig(): EChartOption {
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
          },
          {
            name: this._translate.instant('app.user.played'),
          },
          {
            name: this._translate.instant('app.user.notPlayed'),
          },
          {
            name: this._translate.instant('app.user.completionRate100'),
          },
          {
            name: this._translate.instant('app.user.completionRate75_100'),
          },
          {
            name: this._translate.instant('app.user.completionRate50_75'),
          },
          {
            name: this._translate.instant('app.user.completionRate25_50'),
          },
          {
            name: this._translate.instant('app.user.completionRate0_25'),
          },
        ],
        links: [
          {
            source: this._translate.instant('app.user.playerImpressions'),
            target: this._translate.instant('app.user.played'),
            value: 27
          },
          {
            source: this._translate.instant('app.user.playerImpressions'),
            target: this._translate.instant('app.user.notPlayed'),
            value: 14
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate100'),
            value: 1
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate75_100'),
            value: 4
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate50_75'),
            value: 9
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate25_50'),
            value: 5
          },
          {
            source: this._translate.instant('app.user.played'),
            target: this._translate.instant('app.user.completionRate0_25'),
            value: 6
          },
        ]
      }
    };
  }
}
