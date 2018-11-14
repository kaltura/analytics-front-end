import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';

@Injectable()
export class ImpressionsDataConfig extends ReportDataBaseConfig {
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
        formatter: '{a} <br/>{b} : {c}%'
      },
      color: ['#00745C', '#008569', '#00A784'],
      calculable: true,
      series: [
        {
          name: 'Player Impressions',
          type: 'funnel',
          left: '35%',
          top: 10,
          bottom: 10,
          width: '60%',
          height: 340,
          min: 0,
          max: 100,
          minSize: '5%',
          maxSize: '100%',
          sort: 'descending',
          gap: 0,
          label: {
            show: true,
            verticalAlign: 'top',
            position: 'inside',
            formatter: '{c}%',
            fontFamily: 'Lato',
            fontSize: 15,
            fontWeight: 'bold'
          },
          labelLine: {
            show: false
          },
          itemStyle: {
            borderWidth: 0
          },
          data: []
        }
      ]
    };
  }
}
