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
         'unique_known_users': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'avg_view_drop_off': {
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
            tooltip: this._translate.instant(`app.audience.geo.count_plays_tt`),
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.audience.geo.unique_known_users`),
            tooltip: this._translate.instant(`app.audience.geo.unique_known_users_tt`),
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value),
            title: this._translate.instant(`app.audience.geo.avg_view_drop_off`),
            tooltip: this._translate.instant(`app.audience.geo.avg_view_drop_off_tt`),
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
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#999999'
        },
        formatter: (params) => {
          if (params.name && parseFloat(params.value) >= 0) {
            let tooltip = params.seriesName + '<br/>' + params.name + ' : ' + params.value;
            if (params.seriesName === 'Play-through Ratio') {
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
          color: ['#B4E9FF', '#2541B8']
        }
      },
      series: [
        {
          name: '',
          type: 'map',
          mapType: 'world',
          roam: 'move',
          zoom: 1.2,
          selectedMode: 'single',
          animationDurationUpdate: 200,
          animationEasingUpdate: 'cubicInOut',
          itemStyle: {
            areaColor: '#ebebeb',
            borderColor: '#999999',
            emphasis: {label: {show: true}, areaColor: '#F49616'}
          },
          data: []
        }
      ]
    };
  }
}
