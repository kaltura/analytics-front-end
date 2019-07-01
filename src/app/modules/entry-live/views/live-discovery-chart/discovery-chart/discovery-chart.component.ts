import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EChartOption } from 'echarts';
import { ReportDataFields } from 'shared/services/storage-data-base.config';
import { getPrimaryColor } from 'shared/utils/colors';
import { LiveDiscoveryData } from '../live-discovery.widget';

@Component({
  selector: 'app-discovery-chart',
  templateUrl: './discovery-chart.component.html',
  styleUrls: ['./discovery-chart.component.scss']
})
export class DiscoveryChartComponent {
  @Input() fields: ReportDataFields;
  
  @Input() isBusy: boolean;
  
  @Input() colorsMap: { [metric: string]: string } = {};
  
  @Input() selectedMetrics: string[];
  
  @Input() isPolling = true;
  
  @Input() togglePollingDisabled = false;
  
  @Input() set data(value: LiveDiscoveryData) {
    if (value) {
      this._data = value;
      this._handleData(value);
    } else {
      this._totalsData = null;
      this._chartData = null;
      this._data = null;
    }
  }
  
  @Output() togglePolling = new EventEmitter<void>();
  
  private _data: LiveDiscoveryData;
  private _defaultMetrics = ['avg_view_dropped_frames_ratio', 'view_unique_buffering_users'];
  private _dataZoomStart = 0;
  private _dataZoomEnd = 100;
  
  public _chartData: EChartOption;
  public _totalsData: { [key: string]: string };
  
  private _handleData(value: LiveDiscoveryData): void {
    const chartData = value.graphs;
    const metrics = this.selectedMetrics || this._defaultMetrics;
    const [mainMetric, secondaryMetric] = metrics;
    this._totalsData = value.totals;

    // postpone data update to make sure all local properties are updated before the graph update
    setTimeout(() => {
      this._chartData = this._getGraphConfig(metrics, chartData[mainMetric], chartData[secondaryMetric], chartData['times']);
    }, 0);
  }
  
  private _getTooltipFormatter(params: any[]): string {
    // seriesName
    const [main, secondary] = params;
    const getFormatFn = (name, val) => typeof this.fields[name].graphTooltip === 'function'
      ? this.fields[name].graphTooltip(val)
      : val;

    const mainValue = getFormatFn(main.seriesName, main.value);
    const secondaryValue = getFormatFn(secondary.seriesName, secondary.value);

    return `<div class="kGraphTooltip">${main.name}<br/><span class="kBullet" style="color: ${this.colorsMap[main.seriesName]}">&bull;</span>&nbsp;${mainValue}<br/><span class="kBullet" style="color: ${this.colorsMap[secondary.seriesName]}">&bull;</span>&nbsp;${secondaryValue}</div>`;
  }
  
  private _getGraphConfig(metrics: string[], main: string[], secondary: string[], times: string[]): EChartOption {
    const [mainMetric, secondaryMetric] = metrics;
    
    const seriesCommon = {
      type: 'line',
      lineStyle: {
        width: 3
      },
      symbol: 'circle',
      symbolSize: 8,
      showSymbol: false
    };
    
    const yAxisCommon = {
      type: 'value',
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: {
        lineStyle: {
          color: '#ebebeb'
        }
      },
    };
    
    const createFunc = func => series => parseFloat(func(...[].concat.apply([], series)).toFixed(1));
    const getMaxValue = createFunc(Math.max);
    const getMinValue = createFunc(Math.min);
    const getDefaultMax = metric => ['avg_view_dropped_frames_ratio'].indexOf(metric) !== -1 ? 100 : 1;
    const getInterval = (a, b) => b ? getInterval(b, a % b) : Math.abs(a); // greatest common divisor function
    const getColor = metric => this.colorsMap[metric] ? this.colorsMap[metric] : getPrimaryColor();
    const yAxisLabelFormatter = (param, metric) => {
      if (typeof this.fields[metric].units === 'function') {
        return `${param} ${this.fields[metric].units()}`;
      }
      return param;
    };
    let mainMax = getMaxValue(main) || getDefaultMax(mainMetric);
    let secondaryMax = getMaxValue(secondary) || getDefaultMax(secondaryMetric);
    if (this.shouldNormalize(mainMetric, secondaryMetric)) {
      mainMax = secondaryMax = Math.max(mainMax, secondaryMax);
    }
    let mainMin = getMinValue(main);
    let secondaryMin = getMinValue(secondary);
    
    // prevent having min equals max
    mainMin = mainMin === mainMax ? 0 : mainMin;
    secondaryMin = secondaryMin === secondaryMax ? 0 : secondaryMin;

    const mainInterval = parseFloat(((mainMax - mainMin) / 5).toFixed(2));
    const secondaryInterval = parseFloat(((secondaryMax - secondaryMin) / 5).toFixed(2));

    return {
      color: this.selectedMetrics.map(metric => getColor(metric)),
      textStyle: {
        fontFamily: 'Lato',
      },
      grid: {
        top: 24, left: 24, bottom: 74, right: 24, containLabel: true
      },
      tooltip: {
        formatter: this._getTooltipFormatter.bind(this),
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#999999'
        },
        axisPointer: {
          lineStyle: {
            color: '#dadada'
          },
          z: 0
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: times,
        axisLabel: {
          color: '#999999',
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'Lato',
          padding: [12, 0, 0, 0],
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: '#ebebeb'
          }
        },
        axisLine: {
          lineStyle: {
            color: '#ebebeb'
          }
        }
      },
      yAxis: [
        {
          ...yAxisCommon,
          name: mainMetric,
          nameTextStyle: { color: 'rgba(0, 0, 0, 0)' },
          axisLabel: {
            color: '#999999',
            fontWeight: 'bold',
            formatter: param => yAxisLabelFormatter(param, mainMetric),
          },
          max: mainMax,
          min: mainMin,
          interval: mainInterval
        },
        {
          ...yAxisCommon,
          name: secondaryMetric,
          nameTextStyle: { color: 'rgba(0, 0, 0, 0)' },
          axisLabel: {
            color: '#999999',
            fontWeight: 'bold',
            formatter: param => yAxisLabelFormatter(param, secondaryMetric),
          },
          max: secondaryMax,
          min: secondaryMin,
          interval: secondaryInterval
        },
      ],
      series: [
        {
          ...seriesCommon,
          data: main,
          name: mainMetric,
          lineStyle: { width: 3, color: getColor(mainMetric) }
        },
        {
          ...seriesCommon,
          data: secondary,
          name: secondaryMetric,
          yAxisIndex: 1,
          lineStyle: { width: 3, color: getColor(secondaryMetric) }
        },
      ],
      dataZoom: [
        {
          show: true,
          realtime: true,
          start: this._dataZoomStart,
          end: this._dataZoomEnd,
          fillerColor: 'rgba(49, 190, 166, .5)',
          handleSize: '125%',
          backgroundColor: 'white',
          showDetail: false,
          handleIcon: 'image://data:image/png;base64,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',
          dataBackground: {
            areaStyle: {
              color: '#cccccc',
              opacity: 1,
            },
            lineStyle: {
              color: '#cccccc',
              opacity: 1,
            }
          }
        }
      ],
    };
  }

  private shouldNormalize(metric1, metric2): boolean {
    const normalizedMetrics = ['view_unique_buffering_users', 'view_unique_audience', 'view_unique_audience_dvr', 'view_unique_engaged_users'];
    return normalizedMetrics.indexOf(metric1) > -1 && normalizedMetrics.indexOf(metric2) > -1;
  }
  
  public _onChartInit(chartInstance): void {
    chartInstance.on('datazoom', ({ start, end }) => {
      this._dataZoomStart = start;
      this._dataZoomEnd = end;
    });
  }
  
  public resetDataZoom(): void {
    this._dataZoomStart = 0;
    this._dataZoomEnd = 100;
  }
  
  public displayMetrics(metrics: string[]): void {
    this.selectedMetrics = metrics;
    
    if (this._data) {
      this._handleData(this._data);
    }
  }
}
