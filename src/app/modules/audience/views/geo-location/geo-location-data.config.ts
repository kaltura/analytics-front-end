import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';

@Injectable()
export class GeoLocationDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            nonComparable: true,
          },
          'country': {
            format: value => value,
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'play_through_ratio': {
            format: value => ReportHelper.percents(value)
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.audience.geo.count_plays`),
            tooltip: this._translate.instant(`app.geo.count_plays_tt`),
          },
          'play_through_ratio': {
            format: value => ReportHelper.percents(value),
            title: this._translate.instant(`app.audience.geo.play_through_ratio`),
            tooltip: this._translate.instant(`app.geo.play_through_ratio_tt`),
          }
        }
      }
    };
  }

  public getMapConfig(): EChartOption {
    return {
      grid: {
        top: 24, left: 24, bottom: 24, right: 24
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (params.name && params.value) {
            let tooltip = params.seriesName + '<br/>' + params.name + ' : ' + params.value;
            if (params.seriesName === 'Play-through Ratio'){
              tooltip = tooltip + '%';
            }
            return tooltip;
          } else {
            return this._translate.instant('app.common.na');
          }
        }
      },
      visualMap: {
        min: 0,
        max: 1000000,
        left: 16,
        realtime: false,
        calculable: true,
        inRange: {
          color: ['#B3E8FF', '#6991D9', '#2642B8']
        }
      },
      series: [
        {
          name: '',
          type: 'map',
          mapType: 'world',
          roam: true,
          zoom: 1.2,
          itemStyle: {
            emphasis: {label: {show: true}, areaColor: '#F49616'}
          },
          data: []
        }
      ]
    };
  }
}
