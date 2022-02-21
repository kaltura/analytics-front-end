import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ReportDataConfig, ReportDataSection, ReportDataBaseConfig} from 'shared/services/storage-data-base.config';
import {ReportHelper} from 'shared/services';
import {EChartOption} from 'echarts';

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
          'coordinates': {
            format: value => value
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
          'world_region': {
            format: value => value,
            nonComparable: true,
          },
          'registered': {
            format: value => value
          },

        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'registered',
        fields: {
          'registered': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.ve.registered`),
          }
        }
      }
    };
  }

  public getMapConfig(): EChartOption {
    let config =  {
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
            let tooltip = '<span style="color: #999999">' + params.name + '</span><br/>' + params.seriesName + ' : ' + params.data.value[2];
            if (params.seriesName === 'Avg. Drop Off') {
              tooltip = tooltip + '%';
            }
            return tooltip;
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
    config.series = [
      {
        name: '',
        type: 'map',
        mapType: 'world',
        roam: false,
        zoom: 1.2,
        top: 40,
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
    ];
    if (config['geo']) {
      delete config['geo'];
    }
    return config as any;
  }
}
