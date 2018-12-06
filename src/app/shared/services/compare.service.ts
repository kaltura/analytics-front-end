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

@Injectable()
export class CompareService implements OnDestroy {
  constructor(private _translate: TranslateService,
              private _trendService: TrendService) {
  }

  ngOnDestroy() {
  }

  public compareGraphData(currentPeriod: { from: string, to: string },
                          comparePeriod: { from: string, to: string },
                          current: KalturaReportGraph[],
                          compare: KalturaReportGraph[],
                          config: ReportDataItemConfig,
                          reportInterval: KalturaReportInterval,
                          dataLoadedCb?: Function): GraphsData {
    const lineChartData = {};
    const barChartData = {};

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
      if (!config.fields[graph.id] || !graph.data || !compare[i].data) {
        return;
      }
      let xAxisData = [];
      let yAxisCurrentData = [];
      let yAxisCompareData = [];

      const currentData = graph.data.split(';');
      const compareData = compare[i].data.split(';');

      currentData.forEach((currentValue, j) => {
        const compareValue = compareData[j];
        if (currentValue && currentValue.length && compareValue && compareValue.length) {
          const currentLabel = currentValue.split(',')[0];

          const currentName = reportInterval === KalturaReportInterval.months
            ? DateFilterUtils.formatMonthOnlyString(currentLabel, analyticsConfig.locale)
            : DateFilterUtils.formatShortDateString(currentLabel, analyticsConfig.locale);

          let currentVal = Math.ceil(parseFloat(currentValue.split(',')[1])); // publisher storage report should round up graph values
          let compareVal = Math.ceil(parseFloat(compareValue.split(',')[1])); // publisher storage report should round up graph values
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
            <span class="kValue">${current.seriesName}</span>&nbsp;${currentValue}<br/>
            <span class="kBullet" style="color: ${colors[1]}">&bull;</span>&nbsp;
            <span class="kValue">${compare.seriesName}</span>&nbsp;${compareValue}
          </div>
        `;
      };
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
            fontFamily: 'Lato'
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
            fontFamily: 'Lato'
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
            fontFamily: 'Lato'
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
            fontFamily: 'Lato'
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
                          config: ReportDataItemConfig): { columns: string[], tableData: { [key: string]: string }[] } {
    if (!current.header || !current.data || !compare.header || !compare.data) {
      return;
    }

    // parse table columns
    let columns = current.header.toLowerCase().split(',');
    const tableData = [];

    // parse table data
    const currentData = current.data.split(';');
    const compareData = compare.data.split(';');

    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(currentPeriod.to, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(comparePeriod.to, analyticsConfig.locale)}`;

    currentData.forEach((valuesString, i) => {
      const compareValuesString = compareData[i];
      if (valuesString.length) {
        let data = {};
        const currentValues = valuesString.split(',');
        let hasConsistentData = false;
        let compareValues = [];
        if (compareValuesString) {
          hasConsistentData = true;
          compareValues = compareValuesString.split(',');
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
              const tooltip = `
                ${this._trendService.getTooltipRowString(currentPeriodTitle, currentVal, fieldConfig.units ? fieldConfig.units(value) : (config.units || ''))}
                ${this._trendService.getTooltipRowString(comparePeriodTitle, compareVal, hasConsistentData ? (fieldConfig.units ? fieldConfig.units(compareValues[j]) : (config.units || '')) : '')}
              `;
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

    columns = columns.filter(header => config.fields.hasOwnProperty(header));

    return { columns, tableData };
  }

  public compareTotalsData(currentPeriod: { from: string, to: string },
                           comparePeriod: { from: string, to: string },
                           current: KalturaReportTotal,
                           compare: KalturaReportTotal,
                           config: ReportDataItemConfig,
                           selected?: string): Tab[] {
    if (!current.header || !current.data || !compare.header || !compare.data) {
      return;
    }

    const tabsData = [];
    const data = current.data.split(',');
    const compareData = compare.data.split(',');
    const currentPeriodTitle = `${DateFilterUtils.formatMonthDayString(currentPeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(currentPeriod.to, analyticsConfig.locale)}`;
    const comparePeriodTitle = `${DateFilterUtils.formatMonthDayString(comparePeriod.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(comparePeriod.to, analyticsConfig.locale)}`;

    current.header.split(',').forEach((header, index) => {
      const field = config.fields[header];
      if (field) {
        const { value: trend, direction } = this._trendService.calculateTrend(Number(data[index] || 0), Number(compareData[index] || 0));
        const currentVal = field.format(data[index] || '0');
        const compareVal = field.format(compareData[index] || '0');
        tabsData.push({
          title: field.title,
          tooltip: `
            ${this._trendService.getTooltipRowString(currentPeriodTitle, currentVal, field.units ? field.units(data[index]) : config.units || '')}
            ${this._trendService.getTooltipRowString(comparePeriodTitle, compareVal, field.units ? field.units(compareData[index]) : config.units || '')}
          `,
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

