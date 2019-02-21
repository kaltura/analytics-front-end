import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportTotal } from 'kaltura-ngx-client';
import { ReportDataItemConfig } from 'shared/services/storage-data-base.config';
import { GraphsData } from 'shared/services/report.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { TrendService } from 'shared/services/trend.service';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import * as moment from 'moment';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Injectable()
export class CompareService implements OnDestroy {
  constructor(private _translate: TranslateService,
              private _trendService: TrendService,
              private _logger: KalturaLogger) {
    this._logger = _logger.subLogger('CompareService');
  }

  ngOnDestroy() {
  }
  
  private _getCompareValue(compareData: string[], date: moment.Moment, datesDiff: number, reportInterval: KalturaReportInterval): string {
    const relevantDate = DateFilterUtils.getMomentDate(date).subtract(datesDiff);
    const relevantLabelString = reportInterval === KalturaReportInterval.days
      ? relevantDate.format('YYYYMMDD')
      : relevantDate.format('YYYYMM');
  
    const compareString = compareData.find(item => (item.split(analyticsConfig.valueSeparator)[0] || '') === relevantLabelString);
    return compareString ? compareString.split(analyticsConfig.valueSeparator)[1] : '0';
  }

  public compareGraphData(currentPeriod: { from: number, to: number },
                          comparePeriod: { from: number, to: number },
                          current: KalturaReportGraph[],
                          compare: KalturaReportGraph[],
                          config: ReportDataItemConfig,
                          reportInterval: KalturaReportInterval,
                          dataLoadedCb?: Function,
                          graphOptions?: { xAxisLabelRotation?: number, yAxisLabelRotation?: number }): GraphsData {
    const lineChartData = {};
    const barChartData = {};
    const datesDiff = DateFilterUtils.getMomentDate(currentPeriod.from).diff(DateFilterUtils.getMomentDate(comparePeriod.from));

    let currentPeriodTitle = '';
    let comparePeriodTitle = '';
    if (reportInterval === KalturaReportInterval.months) {
      currentPeriodTitle = `${DateFilterUtils.formatMonthString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthString(currentPeriod.to, analyticsConfig.locale)}`;
      comparePeriodTitle = `${DateFilterUtils.formatMonthString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthString(comparePeriod.to, analyticsConfig.locale)}`;
    } else {
      currentPeriodTitle = `${DateFilterUtils.formatFullDateString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatFullDateString(currentPeriod.to, analyticsConfig.locale)}`;
      comparePeriodTitle = `${DateFilterUtils.formatFullDateString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatFullDateString(comparePeriod.to, analyticsConfig.locale)}`;
    }
  
    this._logger.trace(
      'Compare graph data',
      () => ({ currentPeriod, comparePeriod, reportInterval, graphIds: current.map(({ id }) => id).join(', ') })
    );

    current.forEach((graph: KalturaReportGraph, i) => {
      if (!config.fields[graph.id] || !graph.data) {
        return;
      }
      let xAxisData = [];
      let yAxisCurrentData = [];
      let yAxisCompareData = [];

      const currentData = graph.data.split(';');
      const compareData = compare[i].data
        ? compare[i].data.split(';')
        : currentData.map(() => `N/A${analyticsConfig.valueSeparator}0`);

      currentData.forEach((currentValue, j) => {
        if (currentValue && currentValue.length) {
          const currentLabel = currentValue.split(analyticsConfig.valueSeparator)[0];
          let compareValue;
          
          if (!config.fields[graph.id].nonDateGraphLabel) {
            compareValue = this._getCompareValue(
              compareData,
              DateFilterUtils.parseDateString(currentLabel),
              datesDiff,
              reportInterval
            ) || '0';
          } else {
            compareValue = compareData.find(item => (item.split(analyticsConfig.valueSeparator)[0] || '') === currentLabel) || '0';
          }
          
          let currentName = currentLabel;

          if (!config.fields[graph.id].nonDateGraphLabel) {
            currentName = reportInterval === KalturaReportInterval.months
              ? DateFilterUtils.formatMonthOnlyString(currentLabel, analyticsConfig.locale)
              : DateFilterUtils.formatShortDateString(currentLabel, analyticsConfig.locale);
          } else {
            this._logger.debug('Graph label is not a date, skip label formatting according to time interval');
          }
          
          let currentVal: string | number = currentValue.split(analyticsConfig.valueSeparator)[1];
  
          if (config.fields[graph.id] && config.fields[graph.id].parse) {
            currentVal = config.fields[graph.id].parse(currentVal);
            compareValue = config.fields[graph.id].parse(compareValue);
          } else {
            currentVal = parseFloat(currentVal);
            compareValue = parseFloat(compareValue);
          }
  
          if (isNaN(currentVal)) {
            currentVal = 0;
          }

          if (isNaN(compareValue)) {
            compareValue = 0;
          }

          if (config.fields[graph.id]) {
            currentVal = config.fields[graph.id].format(currentVal);
            compareValue = config.fields[graph.id].format(compareValue);
          }

          xAxisData.push(currentName);
          yAxisCurrentData.push(currentVal);
          yAxisCompareData.push(compareValue);
        }
      });
  
      const defaultColors = [getPrimaryColor(), getSecondaryColor()];
      const getFormatter = colors => params => {
        const [current, compare] = params;
        const currentValue = typeof config.fields[graph.id].graphTooltip === 'function'
          ? config.fields[graph.id].graphTooltip(current.value)
          : current.value;
        const compareValue = typeof config.fields[graph.id].graphTooltip === 'function'
          ? config.fields[graph.id].graphTooltip(compare.value)
          : compare.value;
        return `
          <div class="kGraphTooltip">
            ${current.name}<br/>
            <span class="kBullet" style="color: ${colors[0]}">&bull;</span>&nbsp;
            <span class="kValue kSeriesName">${current.seriesName}</span>&nbsp;${currentValue}<br/>
            <span class="kBullet" style="color: ${colors[1]}">&bull;</span>&nbsp;
            <span class="kValue kSeriesName">${compare.seriesName}</span>&nbsp;${compareValue}
          </div>
        `;
      };
      const xAxisLabelRotation = graphOptions ? graphOptions.xAxisLabelRotation : null;
      const yAxisLabelRotation = graphOptions ? graphOptions.yAxisLabelRotation : null;
      lineChartData[graph.id] = {
        textStyle: {
          fontFamily: 'Lato',
        },
        grid: {
          top: 24, left: 24, bottom: 64, right: 24, containLabel: true
        },
        color: config.fields[graph.id].colors || defaultColors,
        xAxis: {
          type: 'category',
          boundaryGap: true,
          data: xAxisData,
          axisLabel: {
            color: '#999999',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'Lato',
            rotate: xAxisLabelRotation ? xAxisLabelRotation : 0
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
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#999999',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'Lato',
            rotate: yAxisLabelRotation ? yAxisLabelRotation : 0
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: '#ebebeb'
            }
          }
        },
        tooltip: {
          formatter: getFormatter(config.fields[graph.id].colors || defaultColors),
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
          }
        },
        legend: {
          data: [currentPeriodTitle, comparePeriodTitle],
          icon: 'circle',
          itemWidth: 11,
          left: 0,
          bottom: 24,
          padding: [0, 0, 0, 24],
          selectedMode: false,
          textStyle: {
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        series: [{
          name: currentPeriodTitle,
          data: yAxisCurrentData,
          type: 'line',
          lineStyle: {
            width: 3
          },
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: false
        },
        {
          name: comparePeriodTitle,
          data: yAxisCompareData,
          type: 'line',
          lineStyle: {
            width: 3
          },
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: false
        }]
      };
      barChartData[graph.id] = {
        textStyle: {
          fontFamily: 'Lato',
        },
        grid: {
          top: 24, left: 24, bottom: 64, right: 24, containLabel: true
        },
        color: config.fields[graph.id].colors || defaultColors,
        xAxis: {
          type: 'category',
          data: xAxisData,
          axisLabel: {
            color: '#999999',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'Lato',
            rotate: xAxisLabelRotation ? xAxisLabelRotation : 0
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
        yAxis: {
          type: 'value',
          axisLabel: {
            color: '#999999',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: 'Lato',
            rotate: yAxisLabelRotation ? yAxisLabelRotation : 0
          },
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            lineStyle: {
              color: '#ebebeb'
            }
          }
        },
        tooltip: {
          formatter: getFormatter(config.fields[graph.id].colors || defaultColors),
          trigger: 'axis',
          backgroundColor: '#ffffff',
          borderColor: '#dadada',
          borderWidth: 1,
          extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
          textStyle: {
            color: '#999999'
          },
          axisPointer: {
            type: 'shadow',
            shadowStyle: {
              color: 'rgba(150,150,150,0.1)'
            }
          }
        },
        legend: {
          data: [currentPeriodTitle, comparePeriodTitle],
          icon: 'circle',
          itemWidth: 11,
          left: 0,
          bottom: 24,
          padding: [0, 0, 0, 24],
          selectedMode: false,
          textStyle: {
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        series: [{
          name: currentPeriodTitle,
          data: yAxisCurrentData,
          barGap: 0,
          type: 'bar'
        },
        {
          name: comparePeriodTitle,
          data: yAxisCompareData,
          barGap: 0,
          type: 'bar'
        }]
      };

      if (typeof dataLoadedCb === 'function') {
        setTimeout(() => {
          dataLoadedCb();
        }, 200);
      }
    });

    return { barChartData, lineChartData };
  }

  public compareTableData(currentPeriod: { from: number, to: number },
                          comparePeriod: { from: number, to: number },
                          current: KalturaReportTable,
                          compare: KalturaReportTable,
                          config: ReportDataItemConfig,
                          reportInterval: KalturaReportInterval,
                          dataKey: string = ''): { columns: string[], tableData: { [key: string]: string }[] } {
    if (!current.header || !current.data) {
      return { columns: [], tableData: [] };
    }
  
    this._logger.trace('Parse table data', { headers: current.header });

    // parse table columns
    let columns = current.header.toLowerCase().split(analyticsConfig.valueSeparator);
    const tableData = [];

    // parse table data
    const currentData = current.data.split(';');
    const compareData = compare.data ? compare.data.split(';') : [];

    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(currentPeriod.to, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(comparePeriod.to, analyticsConfig.locale)}`;
    const datesDiff = DateFilterUtils.getMomentDate(currentPeriod.from).diff(DateFilterUtils.getMomentDate(comparePeriod.from));

    currentData.forEach(valuesString => {
      let compareValuesString = null;
      let relevantLabelString;
      if (dataKey.length) {
        const dataIndex = columns.indexOf(dataKey.toLowerCase());
        relevantLabelString = valuesString.split(analyticsConfig.valueSeparator)[dataIndex];
      } else {
        const currentLabel = (valuesString || '').split(analyticsConfig.valueSeparator)[0];
        const currentLabelDate = currentLabel ? DateFilterUtils.parseDateString(currentLabel) : null;
        
        if (currentLabelDate && currentLabelDate.isValid()) {
          const relevantDate = DateFilterUtils.getMomentDate(currentLabelDate).subtract(datesDiff);
          relevantLabelString = reportInterval === KalturaReportInterval.days
            ? relevantDate.format('YYYYMMDD')
            : relevantDate.format('YYYYMM');
        } else {
          relevantLabelString = currentLabel;
        }
      }
  
      compareValuesString = relevantLabelString
        ? compareData.find(item => item.split(analyticsConfig.valueSeparator)[0] === relevantLabelString)
        : null;

      if (valuesString.length) {
        let data = {};
        const currentValues = valuesString.split(analyticsConfig.valueSeparator);
        let hasConsistentData = false;
        let compareValues = [];
        if (compareValuesString) {
          hasConsistentData = true;
          compareValues = compareValuesString.split(analyticsConfig.valueSeparator);
        } else {
          compareValues = currentValues.map(() => 'N/A');
        }

        currentValues.forEach((value, j) => {
          const fieldConfig = config.fields[columns[j]];
          if (fieldConfig) {
            let result;
            if (fieldConfig.nonComparable) {
              result = fieldConfig.format(value);
            } else {
              const { value: trend, direction } = hasConsistentData ? this._trendService.calculateTrend(Number(value), Number(compareValues[j])) : { value: 0, direction: 0 };
              const currentVal = fieldConfig.format(value);
              const compareVal = hasConsistentData ? fieldConfig.format(compareValues[j]) : 'N/A';
              const tooltip = `${this._trendService.getTooltipRowString(currentPeriodTitle, currentVal, fieldConfig.units ? fieldConfig.units(value) : (config.units || ''))}${this._trendService.getTooltipRowString(comparePeriodTitle, compareVal, hasConsistentData ? (fieldConfig.units ? fieldConfig.units(compareValues[j]) : (config.units || '')) : '')}`;
              result = {
                value: hasConsistentData && trend !== null ? trend : '–',
                tooltip: tooltip,
                trend: direction,
                units: hasConsistentData && trend !== null ? '%' : ''
              };
            }
            data[columns[j]] = result;
          }
        });
        tableData.push(data);
      }
    });
  
    columns = columns.filter(header => config.fields.hasOwnProperty(header) && !config.fields[header].hidden);

    columns.sort((a, b) => {
      const valA = config.fields[a].sortOrder || 0;
      const valB = config.fields[b].sortOrder || 0;
      return valA - valB;
    });


    return { columns, tableData };
  }

  public compareTotalsData(currentPeriod: { from: number, to: number },
                           comparePeriod: { from: number, to: number },
                           current: KalturaReportTotal,
                           compare: KalturaReportTotal,
                           config: ReportDataItemConfig,
                           selected?: string): Tab[] {
    if (!current.header || !current.data) {
      return [];
    }
  
    this._logger.trace('Parse totals data', { headers: current.header });

    const tabsData = [];
    const data = current.data.split(analyticsConfig.valueSeparator);
    const compareData = compare.data ? compare.data.split(analyticsConfig.valueSeparator) : [];
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(currentPeriod.to, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(comparePeriod.to, analyticsConfig.locale)}`;

    current.header.split(analyticsConfig.valueSeparator).forEach((header, index) => {
      const field = config.fields[header];
      if (field) {
        const { value: trend, direction } = this._trendService.calculateTrend(Number(data[index] || 0), Number(compareData[index] || 0));
        const currentVal = field.format(data[index] || '0');
        const compareVal = field.format(compareData[index] || '0');
        tabsData.push({
          title: field.title,
          tooltip: `${this._trendService.getTooltipRowString(currentPeriodTitle, currentVal, field.units ? field.units(data[index]) : config.units || '')}${this._trendService.getTooltipRowString(comparePeriodTitle, compareVal, field.units ? field.units(compareData[index]) : config.units || '')}`,
          value: trend !== null ? trend : '–',
          selected: header === (selected || config.preSelected),
          units: trend !== null ? '%' : '',
          key: header,
          trend: direction,
          sortOrder: field.sortOrder || 0,
        });
      }
    });
  
    return tabsData.sort((a, b) => {
      return a.sortOrder - b.sortOrder;
    });
  }
}

