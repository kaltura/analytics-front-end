import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';

@Injectable()
export class LiveGeoConfig extends ReportDataBaseConfig {
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
          'region': {
            format: value => value,
            nonComparable: true,
          },
          'city': {
            format: value => value,
            nonComparable: true,
          },
          'coordinates': {
            format: value => value,
          },
          'view_unique_audience': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'view_buffer_time_ratio': {
            format: value => ReportHelper.percents(value, false),
          },
          'avg_view_engagement': {
            format: value => ReportHelper.percents(value, false),
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'view_unique_audience',
        fields: {
          'view_unique_audience': {
            format: value => value,
          }
        }
      }
    };
  }
  
  public getMapConfig(scatter: boolean): EChartOption {
    let config = {
      textStyle: {
        fontFamily: 'Lato',
      },
      grid: {
        top: 24, left: 24, bottom: 24, right: 24, containLabel: true
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        padding: 8,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#333333',
          fontWeight: 'bold'
        },
        formatter: (params) => {
          if (params.name && params.data && params.data.value && params.data.value.length === 3) {
            return '<span style="color: #999999">' + params.name + '</span><br/>' + params.seriesName + ' : ' + params.data.value[2];
          } else {
            return this._translate.instant('app.common.na');
          }
        }
      },
      visualMap: {
        show: false,
        min: 0,
        max: 1000000,
        left: 16,
        center: [0, 0],
        calculable: true,
        inRange: {
          color: ['#B4E9FF', '#2541B8']
        }
      },
      series: []
    };
    if (scatter) {
      config['geo'] = {
        map: 'world',
        center: [0, 0],
        top: 70,
        zoom: 1.2,
        roam: false,
        label: {
          emphasis: {
            show: true
          }
        },
        itemStyle: {
          areaColor: '#ebebeb',
          borderColor: '#999999',
          emphasis: {
            label: {
              show: true
            },
            areaColor: '#F8A61A'
          }
        },
      };
      config.series = [
        {
          name: 'Plays',
          type: 'scatter',
          selectedMode: 'single',
          coordinateSystem: 'geo',
          animationDurationUpdate: 200,
          animationEasingUpdate: 'cubicInOut',
          data: [],
          symbolSize: 12,
          label: {
            normal: {
              show: false
            },
            emphasis: {
              show: false
            }
          },
          
          itemStyle: {
            normal: {
              color: '#f4e925',
              shadowBlur: 5,
              shadowColor: '#333'
            },
            emphasis: {
              borderColor: '#fff',
              borderWidth: 1
            }
          }
        }
      ];
    } else {
      config.series = [
        {
          name: '',
          type: 'map',
          mapType: 'world',
          roam: false,
          zoom: 1.2,
          top: 30,
          selectedMode: 'single',
          animationDurationUpdate: 200,
          animationEasingUpdate: 'cubicInOut',
          itemStyle: {
            areaColor: '#ebebeb',
            borderColor: '#999999',
            emphasis: { label: { show: true }, areaColor: '#F49616' }
          },
          data: []
        }
      ];
      if (config['geo']) {
        delete config['geo'];
      }
    }
    return config;
  }
}
