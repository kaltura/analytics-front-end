import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import { EChartOption } from 'echarts';
import { ReportDataFields } from 'shared/services/storage-data-base.config';
import { getPrimaryColor } from 'shared/utils/colors';
import { LiveDiscoveryData } from '../live-discovery.widget';
import { LiveDiscoveryConfig } from '../live-discovery.config';

@Component({
  selector: 'app-discovery-chart',
  templateUrl: './discovery-chart.component.html',
  styleUrls: ['./discovery-chart.component.scss']
})
export class DiscoveryChartComponent implements OnDestroy{
  @Input() fields: ReportDataFields;

  @Input() isBusy: boolean;
  @Input() blockerMessage: boolean;

  @Input() colorsMap: { [metric: string]: string } = {};

  @Input() set selectedMetrics(value: string[]) {
    if (Array.isArray(value)) {
      this._selectedMetrics = value;
      this._selectedTotalsMetrics = value.map(LiveDiscoveryConfig.mapTotalsMetric);
    }
  }

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
  @Output() zoom = new EventEmitter<{startDate: number, endDate: number}>();

  private _data: LiveDiscoveryData;
  private _defaultMetrics = ['avg_view_dropped_frames_ratio', 'avg_view_buffering'];
  private _dataZoomStart = 0;
  private _dataZoomEnd = 100;
  private _echartsIntance: any;

  public _chartData: EChartOption;
  public _totalsData: { [key: string]: string };
  public _selectedMetrics: string[];
  public _selectedTotalsMetrics: string[];

  private _handleData(value: LiveDiscoveryData): void {
    const chartData = value.graphs;
    const metrics = this._selectedMetrics || this._defaultMetrics;
    const [mainMetric, secondaryMetric] = metrics;
    this._totalsData = value.totals;
    this._chartData = this._getGraphConfig(metrics, chartData[mainMetric], chartData[secondaryMetric], chartData['times']);
    if (this._echartsIntance) {
      this._echartsIntance.setOption({
        dataZoom: [{ start: this._dataZoomStart, end: this._dataZoomEnd }]
      });
    }
  }

  private _getTooltipFormatter(params: any[]): string {
    if (!params.length) {
      return null;
    }

    const getFormatFn = (name, val) => typeof this.fields[name].graphTooltip === 'function'
      ? this.fields[name].graphTooltip(val)
      : val;

    // seriesName
    let result = `<div class="kGraphTooltip">${params[0].name}`;
    params.forEach(metric => {
      const value = getFormatFn(metric.seriesName, metric.value);
      result += `<br/><span class="kBullet" style="color: ${this.colorsMap[metric.seriesName]}">&bull;</span>&nbsp;${value}`;
    });
    result += '</div>';

    return result;
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

    if (this.shouldNormalize(mainMetric) && this.shouldNormalize(secondaryMetric)) {
      mainMax = secondaryMax = Math.max(mainMax, secondaryMax);
    }

    let mainMin = this.shouldNormalize(mainMetric) ? 0 : getMinValue(main);
    let secondaryMin = this.shouldNormalize(secondaryMetric) ? 0 : getMinValue(secondary);

    // prevent having min equals max
    mainMin = mainMin === mainMax ? 0 : mainMin;
    secondaryMin = secondaryMin === secondaryMax ? 0 : secondaryMin;

    const mainInterval = parseFloat(((mainMax - mainMin) / 5).toFixed(2));
    const secondaryInterval = parseFloat(((secondaryMax - secondaryMin) / 5).toFixed(2));

    return {
      color: this._selectedMetrics.map(metric => getColor(metric)),
      textStyle: {
        fontFamily: 'Lato',
      },
      grid: {
        top: 24, left: main ? 24 : 48, bottom: 24, right: secondary ? 24 : 48, containLabel: true
      },
      toolbox: {
        top: 0,
        left: -150,
        feature: {
          dataZoom: {yAxisIndex: 'none'},
          restore: {}
        }
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
      ]
    };
  }

  private shouldNormalize(metric: string): boolean {
    const normalizedMetrics = ['view_unique_buffering_users', 'view_unique_audience', 'view_unique_audience_dvr', 'view_unique_engaged_users', 'avg_view_live_latency'];
    return normalizedMetrics.indexOf(metric) > -1;
  }

  public _onChartInit(chartInstance): void {
    this._echartsIntance = chartInstance;

    // preselect zoom feature in toolbox to enable zooming without clicking the zoom icon
    setTimeout(() => {
      this._echartsIntance.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'dataZoomSelect',
        dataZoomSelectActive: true
      });
    }, 0);

    this._echartsIntance.on('datazoom', this.handleZoomEvent.bind(this));
  }

  private handleZoomEvent(event): void {
    let startIndex = event.batch && event.batch.length ? event.batch[0].startValue : null;
    let endIndex = event.batch && event.batch.length ? event.batch[0].endValue : null;
    const epocs = this._data.graphs['epocs'];
    if (startIndex !== null && endIndex !== null) { // user selected a period of less than 2 point
      if (startIndex === endIndex) {
        if ( startIndex > 0) {
          startIndex--; // extend selected range to include point from the left
        } else if (endIndex < epocs.length - 1) {
          endIndex++; // extend selected range to include point from the right
        } else {
          return; // can't zoom any deeper - abort!
        }
      }
      const startDate = parseInt(epocs[startIndex]);
      const endDate = parseInt(epocs[endIndex]);
      if (this.isPolling) {
        this.togglePolling.emit(); // pause polling when zoomed, TODO: update restore button label if needed by design
      }
      this.zoom.emit({startDate, endDate});
    }
  }

  public displayMetrics(metrics: string[]): void {
    this._selectedMetrics = metrics;
    this._selectedTotalsMetrics = metrics.map(LiveDiscoveryConfig.mapTotalsMetric);

    if (this._data) {
      this._handleData(this._data);
    }
  }

  public resumePolling(): void {
    this._echartsIntance.dispatchAction({
      type: 'restore'
    });
    this.togglePolling.emit();
  }

  ngOnDestroy(): void {
    this._echartsIntance.off('datazoom', this.handleZoomEvent.bind(this));
  }
}
