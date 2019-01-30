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
import { enumerateDaysBetweenDates } from 'shared/utils/enumerateDaysBetweenDates';
import { enumerateMonthsBetweenDates } from 'shared/utils/enumerateMonthsBetweenDates';

@Injectable()
export class CompareService implements OnDestroy {
  constructor(private _translate: TranslateService,
              private _trendService: TrendService) {
  }

  ngOnDestroy() {
  }
  
  private _getMissingDatesValues(startDate: moment.Moment,
                                 endDate: moment.Moment,
                                 reportInterval: KalturaReportInterval,
                                 formatFn: Function,
                                 compareData: string[],
                                 datesDiff: number): { name: string, value: number, compare: number }[] {
    const formatValue = value => typeof formatFn === 'function' ? formatFn(value) : value;
    const dates = reportInterval === KalturaReportInterval.days
      ? enumerateDaysBetweenDates(startDate, endDate)
      : enumerateMonthsBetweenDates(startDate, endDate);
    
    return dates.map(date => {
      const label = date.format('YYYYMMDD');
      const relevantDate = moment(date).subtract(datesDiff);
      const relevantLabelString = reportInterval === KalturaReportInterval.days
        ? relevantDate.format('YYYYMMDD')
        : relevantDate.format('YYYYMM');
      
      const compareString = compareData.find(item => (item.split(analyticsConfig.valueSeparator)[0] || '') === relevantLabelString);
      const compareValue = compareString ? compareString.split(analyticsConfig.valueSeparator)[1] : 0;

      const name = reportInterval === KalturaReportInterval.months
        ? DateFilterUtils.formatMonthOnlyString(label, analyticsConfig.locale)
        : DateFilterUtils.formatShortDateString(label, analyticsConfig.locale);
      
      return { name, value: formatValue(0), compare: formatValue(compareValue) };
    });
  }

  public compareGraphData(currentPeriod: { from: string, to: string },
                          comparePeriod: { from: string, to: string },
                          current: KalturaReportGraph[],
                          compare: KalturaReportGraph[],
                          config: ReportDataItemConfig,
                          reportInterval: KalturaReportInterval,
                          dataLoadedCb?: Function,
                          graphOptions?: { xAxisLabelRotation?: number, yAxisLabelRotation?: number }): GraphsData {
    const lineChartData = {};
    const barChartData = {};
    const datesDiff = moment(currentPeriod.from).diff(comparePeriod.from);

    let currentPeriodTitle = '';
    let comparePeriodTitle = '';
    if (reportInterval === KalturaReportInterval.months) {
      currentPeriodTitle = `${DateFilterUtils.formatMonthString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthString(currentPeriod.to, analyticsConfig.locale)}`;
      comparePeriodTitle = `${DateFilterUtils.formatMonthString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthString(comparePeriod.to, analyticsConfig.locale)}`;
    } else {
      currentPeriodTitle = `${DateFilterUtils.formatFullDateString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatFullDateString(currentPeriod.to, analyticsConfig.locale)}`;
      comparePeriodTitle = `${DateFilterUtils.formatFullDateString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatFullDateString(comparePeriod.to, analyticsConfig.locale)}`;
    }

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
  
      if (!config.fields[graph.id].nonDateGraphLabel) {
        let fromDate = DateFilterUtils.parseDateString(currentPeriod.from);
        let currentDate = DateFilterUtils.parseDateString((compareData[0] || '').split(analyticsConfig.valueSeparator)[0] || '');
    
        if (reportInterval === KalturaReportInterval.days) {
          fromDate = fromDate.clone().startOf('day');
          currentDate = currentDate.clone().startOf('day');
        } else {
          fromDate = fromDate.clone().startOf('month');
          currentDate = currentDate.clone().startOf('month');
        }
    
        if (fromDate.isBefore(currentDate)) {
          this._getMissingDatesValues(fromDate, currentDate, reportInterval, config.fields[graph.id].format, compareData, datesDiff)
            .forEach(result => {
              xAxisData.push(result.name);
              yAxisCurrentData.push(result.value);
              yAxisCompareData.push(result.compare);
            });
        }
      }

      currentData.forEach((currentValue, j) => {
        if (currentValue && currentValue.length) {
          const currentLabel = currentValue.split(analyticsConfig.valueSeparator)[0];
          const compareValue = compareData[j] || `${currentLabel}${analyticsConfig.valueSeparator}0`;
          let currentName = currentLabel;

          if (!config.fields[graph.id].nonDateGraphLabel) {
            currentName = reportInterval === KalturaReportInterval.months
              ? DateFilterUtils.formatMonthOnlyString(currentLabel, analyticsConfig.locale)
              : DateFilterUtils.formatShortDateString(currentLabel, analyticsConfig.locale);
          }
          
          let currentVal: string | number = currentValue.split(analyticsConfig.valueSeparator)[1];
          let compareVal: string | number = compareValue.split(analyticsConfig.valueSeparator)[1];
  
          if (config.fields[graph.id] && config.fields[graph.id].parse) {
            currentVal = config.fields[graph.id].parse(currentVal);
            compareVal = config.fields[graph.id].parse(compareVal);
          } else {
            currentVal = parseFloat(currentVal);
            compareVal = parseFloat(compareVal);
          }
  
          if (isNaN(currentVal)) {
            currentVal = 0;
          }

          if (isNaN(compareVal)) {
            compareVal = 0;
          }

          if (config.fields[graph.id]) {
            currentVal = config.fields[graph.id].format(currentVal);
            compareVal = config.fields[graph.id].format(compareVal);
          }

          xAxisData.push(currentName);
          yAxisCurrentData.push(currentVal);
          yAxisCompareData.push(compareVal);
  
          if (!config.fields[graph.id].nonDateGraphLabel) {
            const nextValue = currentData[j + 1];

            if (nextValue) {
              let nextValueDate, actualNextValueDate;
              if (reportInterval === KalturaReportInterval.days) {
                nextValueDate = moment(nextValue.split(analyticsConfig.valueSeparator)[0]).startOf('day');
                actualNextValueDate = moment(currentLabel).startOf('day').add(1, 'days');
              } else {
                nextValueDate = DateFilterUtils.parseDateString(nextValue.split(analyticsConfig.valueSeparator)[0]).startOf('month');
                actualNextValueDate = DateFilterUtils.parseDateString(currentLabel).startOf('month').add(1, 'months');
              }
      
              if (!actualNextValueDate.isSame(nextValueDate)) {
                this._getMissingDatesValues(actualNextValueDate, nextValueDate, reportInterval, config.fields[graph.id].format, compareData, datesDiff)
                  .forEach(result => {
                    xAxisData.push(result.name);
                    yAxisCurrentData.push(result.value);
                    yAxisCompareData.push(result.compare);
                  });
              }
            } else {
              let currentDate = DateFilterUtils.parseDateString(currentLabel);
              let toDate = DateFilterUtils.parseDateString(currentPeriod.to);
  
              if (reportInterval === KalturaReportInterval.days) {
                toDate = toDate.clone().startOf('day');
                currentDate = currentDate.clone().startOf('day');
              } else {
                toDate = toDate.clone().startOf('month');
                currentDate = currentDate.clone().startOf('month');
              }
  
              if (currentDate.isBefore(toDate)) {
                toDate = toDate.clone().add(1, reportInterval === KalturaReportInterval.days ? 'days' : 'months');
    
                this._getMissingDatesValues(currentDate, toDate, reportInterval, config.fields[graph.id].format, compareData, datesDiff)
                  .forEach(result => {
                    xAxisData.push(result.name);
                    yAxisCurrentData.push(result.value);
                    yAxisCompareData.push(result.compare);
                  });
              }
            }
          }
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
          left: 'left',
          bottom: 0,
          padding: [16, 0, 0, 80],
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
            type: 'shadow'
          }
        },
        legend: {
          data: [currentPeriodTitle, comparePeriodTitle],
          icon: 'circle',
          left: 'left',
          bottom: 0,
          padding: [16, 0, 0, 80],
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

  public compareTableData(currentPeriod: { from: string, to: string },
                          comparePeriod: { from: string, to: string },
                          current: KalturaReportTable,
                          compare: KalturaReportTable,
                          config: ReportDataItemConfig,
                          dataKey: string = ''): { columns: string[], tableData: { [key: string]: string }[] } {
    if (!current.header || !current.data) {
      return { columns: [], tableData: [] };
    }

    // parse table columns
    let columns = current.header.toLowerCase().split(analyticsConfig.valueSeparator);
    const tableData = [];

    // parse table data
    const currentData = current.data.split(';');
    const compareData = compare.data ? compare.data.split(';') : [];

    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(currentPeriod.to, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(comparePeriod.to, analyticsConfig.locale)}`;

    currentData.forEach((valuesString, i) => {
      let compareValuesString = null;
      if (dataKey.length) {
        const dataIndex = columns.indexOf(dataKey.toLowerCase());
        const key = valuesString.split(analyticsConfig.valueSeparator)[dataIndex];
        if (key && key.length) {
          compareData.some(compareRow => {
            if (compareRow.split(analyticsConfig.valueSeparator)[dataIndex] === key) {
              compareValuesString = compareRow;
              return true;
            }
          });
        }
      } else {
        compareValuesString = compareData[i];
      }
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

  public compareTotalsData(currentPeriod: { from: string, to: string },
                           comparePeriod: { from: string, to: string },
                           current: KalturaReportTotal,
                           compare: KalturaReportTotal,
                           config: ReportDataItemConfig,
                           selected?: string): Tab[] {
    if (!current.header || !current.data) {
      return [];
    }

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

