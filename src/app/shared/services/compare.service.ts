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
import { TableRow } from 'shared/utils/table-local-sort-handler';

@Injectable()
export class CompareService implements OnDestroy {
  constructor(private _translate: TranslateService,
              private _trendService: TrendService,
              private _logger: KalturaLogger) {
    this._logger = _logger.subLogger('CompareService');
  }
  
  ngOnDestroy() {
  }
  
  private _getCompareValue(compareData: string[], date: moment.Moment, datesDiff: number, reportInterval: KalturaReportInterval): [string, string] {
    let relevantLabelString = '';
    let relevantDate = null;
    
    if (reportInterval === KalturaReportInterval.days) {
      relevantDate = DateFilterUtils.getMomentDate(date).subtract(datesDiff);
      relevantLabelString = relevantDate.format('YYYYMMDD');
    } else {
      relevantDate = DateFilterUtils.getMomentDate(date).subtract(datesDiff, 'months');
      relevantLabelString = relevantDate.format('YYYYMM');
    }
    
    let compareString = compareData.find(item => (item.split(analyticsConfig.valueSeparator)[0] || '') === relevantLabelString);
    compareString = compareString ? compareString.split(analyticsConfig.valueSeparator)[1] : '0';
  
    return [compareString, relevantLabelString];
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
    const datesDiff = reportInterval === KalturaReportInterval.months
      ? DateFilterUtils.getMomentDate(currentPeriod.from).diff(DateFilterUtils.getMomentDate(comparePeriod.from), 'months')
      : DateFilterUtils.getMomentDate(currentPeriod.from).diff(DateFilterUtils.getMomentDate(comparePeriod.from));

    let currentPeriodTitle = '';
    let comparePeriodTitle = '';
    if (reportInterval === KalturaReportInterval.months) {
      currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(currentPeriod.to, analyticsConfig.locale)}`;
      comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(comparePeriod.to, analyticsConfig.locale)}`;
    } else {
      currentPeriodTitle = `${DateFilterUtils.formatFullDateString(currentPeriod.from)} – ${DateFilterUtils.formatFullDateString(currentPeriod.to)}`;
      comparePeriodTitle = `${DateFilterUtils.formatFullDateString(comparePeriod.from)} – ${DateFilterUtils.formatFullDateString(comparePeriod.to)}`;
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
          let compareLabel;
          
          if (!config.fields[graph.id].nonDateGraphLabel) {
            const relevantCompareData = this._getCompareValue(
              compareData,
              DateFilterUtils.parseDateString(currentLabel),
              datesDiff,
              reportInterval
            ) || '0';
            compareValue = relevantCompareData[0];
            compareLabel = relevantCompareData[1];
          } else {
            const relevantCompare = compareData.find(item => (item.split(analyticsConfig.valueSeparator)[0] || '') === currentLabel)
              || `N/A${analyticsConfig.valueSeparator}0`;
            compareValue = relevantCompare.split(analyticsConfig.valueSeparator)[1];
          }
          
          let currentName;
          
          if (!config.fields[graph.id].nonDateGraphLabel) {
            currentName = `${currentLabel}${analyticsConfig.valueSeparator}${compareLabel}`;
          } else {
            currentName = currentLabel;
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
        const [currentPeriodDate, comparePeriodDate] = current.axisValue.split(analyticsConfig.valueSeparator);
        let currentPeriod: string | Date = DateFilterUtils.parseDateString(currentPeriodDate).toDate();
        let comparePeriod: string | Date = DateFilterUtils.parseDateString(comparePeriodDate).toDate();
        
        if (reportInterval === KalturaReportInterval.months) {
          currentPeriod = DateFilterUtils.formatMonthString(currentPeriod);
          comparePeriod = DateFilterUtils.formatMonthString(comparePeriod);
        } else {
          currentPeriod = DateFilterUtils.formatMonthDayString(currentPeriod, analyticsConfig.locale, 'long');
          comparePeriod = DateFilterUtils.formatMonthDayString(comparePeriod, analyticsConfig.locale, 'long');
        }

        const currentValue = typeof config.fields[graph.id].graphTooltip === 'function'
          ? config.fields[graph.id].graphTooltip(current.value)
          : current.value;
        const compareValue = typeof config.fields[graph.id].graphTooltip === 'function'
          ? config.fields[graph.id].graphTooltip(compare.value)
          : compare.value;
        return `
          <div class="kGraphTooltip">
            ${comparePeriod}<br/>
            <span class="kBullet" style="color: ${colors[1]}">&bull;</span>&nbsp;${compareValue}<br/>
            ${currentPeriod}<br/>
            <span class="kBullet" style="color: ${colors[0]}">&bull;</span>${currentValue}
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
            rotate: xAxisLabelRotation ? xAxisLabelRotation : 0,
            formatter: value => {
              const [label] = value.split(analyticsConfig.valueSeparator);
              return reportInterval === KalturaReportInterval.months
                ? DateFilterUtils.formatMonthOnlyString(label)
                : DateFilterUtils.formatShortDateString(label);
            }
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
    
    let currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(currentPeriod.to, analyticsConfig.locale)}`;
    let comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(comparePeriod.to, analyticsConfig.locale)}`;
    const datesDiff = DateFilterUtils.getMomentDate(currentPeriod.from).diff(DateFilterUtils.getMomentDate(comparePeriod.from));

    currentData.forEach(valuesString => {
      let compareValuesString;
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
  
          if (reportInterval === KalturaReportInterval.months) {
            currentPeriodTitle = DateFilterUtils.formatMonthString(currentLabelDate.toDate());
            comparePeriodTitle = DateFilterUtils.formatMonthString(relevantDate.toDate());
          } else {
            currentPeriodTitle = DateFilterUtils.formatMonthDayString(currentLabelDate.toDate(), analyticsConfig.locale, 'long');
            comparePeriodTitle = DateFilterUtils.formatMonthDayString(relevantDate.toDate(), analyticsConfig.locale, 'long');
          }
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
              const tooltip = `${this._trendService.getTooltipRowString(comparePeriodTitle, compareVal, hasConsistentData ? (fieldConfig.units ? fieldConfig.units(compareValues[j]) : (config.units || '')) : '')}${this._trendService.getTooltipRowString(currentPeriodTitle, currentVal, fieldConfig.units ? fieldConfig.units(value) : (config.units || ''))}`;
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
  
  public compareTableFromGraph(currentPeriod: { from: number, to: number },
                               comparePeriod: { from: number, to: number },
                               current: KalturaReportGraph[],
                               compare: KalturaReportGraph[],
                               config: ReportDataItemConfig,
                               reportInterval: KalturaReportInterval,
                               dataKey: string = ''): { columns: string[], tableData: TableRow<string>[], totalCount: number } {
    const datesDiff = reportInterval === KalturaReportInterval.months
      ? DateFilterUtils.getMomentDate(currentPeriod.from).diff(DateFilterUtils.getMomentDate(comparePeriod.from), 'months')
      : DateFilterUtils.getMomentDate(currentPeriod.from).diff(DateFilterUtils.getMomentDate(comparePeriod.from));

    let columns = current.map(item => item.id);
    
    const firstColumn = reportInterval === KalturaReportInterval.days ? 'date_id' : 'month_id';
    const getTableData = data => {
      return data[0].filter(Boolean).map((item, i) => {
        return columns.reduce(
          (acc, val, j) => {
            if (config.fields.hasOwnProperty(val) && !config.fields[val].hidden) {
              acc[val] = data[j][i].split(analyticsConfig.valueSeparator)[1];
            }
            return acc;
          },
          { [firstColumn]: item.split(analyticsConfig.valueSeparator)[0] }
        );
      });
    };
    const currentData = getTableData(current.map(item => item.data.split(';')));
    const compareData = getTableData(compare.map(item => item.data.split(';')));
    const tableData = [];
    const getCompareRow = date => {
      let relevantLabelString = '';
      let relevantDate = null;
    
      if (reportInterval === KalturaReportInterval.days) {
        relevantDate = DateFilterUtils.parseDateString(date).subtract(datesDiff);
        relevantLabelString = relevantDate.format('YYYYMMDD');
      } else {
        relevantDate = DateFilterUtils.parseDateString(date).subtract(datesDiff, 'months');
        relevantLabelString = relevantDate.format('YYYYMM');
      }
    
      const compareRow = compareData.find(item => item[firstColumn] === relevantLabelString) || {};
    
      return [compareRow, relevantLabelString];
    };

    currentData.forEach(currentRow => {
      let data = {};
      const rowColumns = Object.keys(currentRow);
      const currentDate = currentRow[firstColumn];
      const [compareRow, compareDate] = getCompareRow(currentDate);
  
      let currentPeriod: string | Date = DateFilterUtils.parseDateString(currentDate).toDate();
      let comparePeriod: string | Date = DateFilterUtils.parseDateString(compareDate).toDate();
  
      if (reportInterval === KalturaReportInterval.months) {
        currentPeriod = DateFilterUtils.formatMonthString(currentPeriod);
        comparePeriod = DateFilterUtils.formatMonthString(comparePeriod);
      } else {
        currentPeriod = DateFilterUtils.formatMonthDayString(currentPeriod, analyticsConfig.locale, 'long');
        comparePeriod = DateFilterUtils.formatMonthDayString(comparePeriod, analyticsConfig.locale, 'long');
      }
      
      rowColumns.forEach(column => {
        const fieldConfig = config.fields[column];
        if (fieldConfig) {
          let result;
          const currentValue = currentRow[column];
          if (fieldConfig.nonComparable) {
            result = fieldConfig.format(currentValue);
          } else {
            const compareValue = compareRow[column] ? compareRow[column] : 0;
            const { value: trend, direction } = this._trendService.calculateTrend(Number(currentValue), Number(compareValue));
            const currentVal = fieldConfig.format(currentValue);
            const compareVal = fieldConfig.format(compareValue);
            const tooltip = `${
              this._trendService.getTooltipRowString(
                comparePeriod,
                compareVal,
                (fieldConfig.units ? fieldConfig.units(compareValue) : (config.units || '')))
            }${
              this._trendService.getTooltipRowString(
                currentPeriod,
                currentVal,
                fieldConfig.units ? fieldConfig.units(currentValue) : (config.units || ''))
            }`;
            result = {
              value: trend !== null ? trend : '–',
              tooltip: tooltip,
              trend: direction,
              units: trend !== null ? '%' : ''
            };
          }
          data[column] = result;
        }
      });
      tableData.push(data);
    });

    columns = [
      firstColumn,
      ...columns
        .filter(header => config.fields.hasOwnProperty(header) && !config.fields[header].hidden)
        .sort((a, b) => {
          const valA = config.fields[a].sortOrder || 0;
          const valB = config.fields[b].sortOrder || 0;
          return valA - valB;
        })
    ];

    return { columns, tableData, totalCount: tableData.length };
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
          tooltip: `${this._trendService.getTooltipRowString(comparePeriodTitle, compareVal, field.units ? field.units(compareData[index]) : config.units || '')}${this._trendService.getTooltipRowString(currentPeriodTitle, currentVal, field.units ? field.units(data[index]) : config.units || '')}`,
          value: trend !== null ? trend : '–',
          selected: header === (selected || config.preSelected),
          units: trend !== null ? '%' : '',
          key: header,
          trend: direction,
          sortOrder: field.sortOrder || 0,
          hidden: !!field.hidden,
        });
      }
    });
    
    return tabsData.sort((a, b) => {
      return a.sortOrder - b.sortOrder;
    });
  }
  
  public compareToMetric(config: ReportDataItemConfig,
                         graphsData: { [key: string]: any },
                         currentMetric: string,
                         compareMetric: string,
                         currentMetricLabel: string,
                         compareMetricLabel: string,
                         currentDate: string = '',
                         compareDate: string = ''): any {
    const current = graphsData[currentMetric];
    const compare = graphsData[compareMetric];
  
    const createFunc = func => series => parseFloat(func(...[].concat.apply([], series.map(({ data }) => data))).toFixed(1));
    const getMaxValue = createFunc(Math.max);
    const getMinValue = createFunc(Math.min);
    const getInterval = (a, b) => b ? getInterval(b, a % b) : Math.abs(a); // greatest common divisor function
    const getFormatter = colors => params => {
      const [current, metric, compare, metricCompare] = params;
      const currentFormatFn = val => typeof config.fields[currentMetric].graphTooltip === 'function'
        ? config.fields[currentMetric].graphTooltip(val)
        : val;
      const compareFormatFn = val => typeof config.fields[compareMetric].graphTooltip === 'function'
        ? config.fields[compareMetric].graphTooltip(val)
        : val;
  
      const [currentPeriodDate, comparePeriodDate] = current.axisValue.split(analyticsConfig.valueSeparator);
      let currentPeriod: string | Date = DateFilterUtils.parseDateString(currentPeriodDate).toDate();
      let comparePeriod: string | Date = DateFilterUtils.parseDateString(comparePeriodDate).toDate();
  
      currentPeriod = DateFilterUtils.formatMonthDayString(currentPeriod, analyticsConfig.locale, 'long');
      comparePeriod = DateFilterUtils.formatMonthDayString(comparePeriod, analyticsConfig.locale, 'long');

      const currentValue = currentFormatFn(current.value);
      const compareValue = compare ? compareFormatFn(compare.value) : compareFormatFn(metric.value);

      if (params.length === 4) {
        const metricValue = currentFormatFn(metric.value);
        const compareMetricValue = compareFormatFn(metricCompare.value);

        return `
          <div class="kGraphTooltip">
            ${comparePeriod}<br/>
            <span class="kBullet" style="color: ${colors[2]}">&bull;</span>&nbsp;${metricValue}<br/>
            <span class="kBullet" style="color: ${colors[3]}">&bull;</span>&nbsp;${compareMetricValue}<br/>
            ${currentPeriod}<br/>
            <span class="kBullet" style="color: ${colors[0]}">&bull;</span>&nbsp;${currentValue}<br/>
            <span class="kBullet" style="color: ${colors[1]}">&bull;</span>&nbsp;${compareValue}
          </div>
      `;
      }
  
      return `
          <div class="kGraphTooltip">
            ${current.name}<br/>
            <span class="kBullet" style="color: ${colors[0]}">&bull;</span>&nbsp;${currentValue}<br/>
            <span class="kBullet" style="color: ${colors[1]}">&bull;</span>&nbsp;${compareValue}
          </div>
      `;
    };
  
    const currentMax = getMaxValue(current.series) || 1;
    const compareMax = getMaxValue(compare.series) || 1;
    let currentMin = getMinValue(current.series);
    let compareMin = getMinValue(compare.series);
  
    // prevent having min equals max
    currentMin = currentMin === currentMax ? 0 : currentMin;
    compareMin = compareMin === compareMax ? 0 : compareMin;

    const currentInterval = parseFloat(((currentMax - currentMin) / 5).toFixed(2));
    const compareInterval = parseFloat(((compareMax - compareMin) / 5).toFixed(2));
    
    return {
      'color': [current.color[0], compare.color[0], current.color[1], compare.color[1]],
      'textStyle': { ...current.textStyle },
      'grid': { ...current.grid, top: 32 },
      'xAxis': { ...current.xAxis },
      'tooltip': {
        ...current.tooltip,
        formatter: getFormatter([current.color[0], compare.color[0], current.color[1], compare.color[1]])
      },
      'yAxis': [
        {
          ...current.yAxis,
          name: currentMetricLabel,
          nameTextStyle: { padding: [0, 0, 0, 10] },
          max: currentMax,
          min: currentMin,
          interval: currentInterval
        },
        {
          ...compare.yAxis,
          name: compareMetricLabel,
          nameTextStyle: { padding: [0, 20, 0, 0] },
          max: compareMax,
          min: compareMin,
          interval: compareInterval
        },
      ],
      'series': [
        ...current.series.map((item, index) => ({
          ...item,
          name: currentMetricLabel,
          lineStyle: { width: 3, color: current.color[index] }
        })),
        ...compare.series.map((item, index) => ({
          ...item,
          name: compareMetricLabel,
          yAxisIndex: 1,
          lineStyle: { width: 3, color: compare.color[index] }
        })),
      ],
      'legend': {
        show: currentDate === '',
        data: [
          { name: currentMetricLabel },
          { name: compareMetricLabel }
        ],
        icon: 'circle',
        itemWidth: 11,
        left: 0,
        bottom: 0,
        padding: [0, 0, 0, 24],
        selectedMode: false,
        textStyle: {
          fontSize: 12,
          fontWeight: 'bold'
        }
      },
    };
  }
}

