import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportTotal } from 'kaltura-ngx-client';
import { ReportDataItemConfig } from 'shared/services/storage-data-base.config';
import { GraphsData } from 'shared/services/report.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { ReportHelper } from 'shared/services/report-helper';

@Injectable()
export class CompareService implements OnDestroy {
  constructor(private _translate: TranslateService) {
  }

  ngOnDestroy() {
  }

  private getTooltipRowString(time, value, units = '') {
    return `<span class="kTotalsCompareTooltip">${time}<span class="kTotalsCompareTooltipValue"><strong>${value}</strong>&nbsp;${units}</span></span>`;
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
        if (currentValue.length && compareValue.length) {
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

      lineChartData[graph.id] = {
        grid: {
          top: 24, left: 54, bottom: 64, right: 24
        },
        color: ['#F49616', '#FCDBA3'],
        xAxis: {
          type: 'category',
          boundaryGap: true,
          data: xAxisData
        },
        yAxis: {
          type: 'value'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            lineStyle: {
              color: '#dadada'
            }
          }
        },
        legend: {
          data: [currentPeriodTitle, comparePeriodTitle],
          left: 'left',
          bottom: 0,
          padding: [16, 0, 0, 80]
        },
        series: [{
          name: currentPeriodTitle,
          data: yAxisCurrentData,
          type: 'line'
        },
        {
          name: comparePeriodTitle,
          data: yAxisCompareData,
          type: 'line'
        }]
      };
      barChartData[graph.id] = {
        grid: {
          top: 24, left: 54, bottom: 64, right: 24
        },
        color: ['#00a784', '#66CAB5'],
        xAxis: {
          type: 'category',
          data: xAxisData
        },
        yAxis: {
          type: 'value'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: [currentPeriodTitle, comparePeriodTitle],
          left: 'left',
          bottom: 0,
          padding: [16, 0, 0, 80]
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
              const trend = hasConsistentData ? this._calculateTrend(Number(value), Number(compareValues[j])) : 0;
              const currentVal = fieldConfig.format(value);
              const compareVal = hasConsistentData ? fieldConfig.format(compareValues[j]) : 'N/A';
              const tooltip = `
                ${this.getTooltipRowString(currentPeriodTitle, currentVal, fieldConfig.units ? fieldConfig.units(value) : (config.units || ''))}
                ${this.getTooltipRowString(comparePeriodTitle, compareVal, hasConsistentData ? (fieldConfig.units ? fieldConfig.units(compareValues[j]) : (config.units || '')) : '')}
              `;
              result = {
                value: hasConsistentData ? String(Math.abs(trend)) : 'N/A',
                tooltip: tooltip,
                trend: trend > 0 ? 1 : trend < 0 ? -1 : 0,
                units: hasConsistentData ? '%' : ''
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
        const trend = this._calculateTrend(Number(data[index]), Number(compareData[index]));
        const currentVal = field.format(data[index]);
        const compareVal = field.format(compareData[index]);
        tabsData.push({
          title: field.title,
          tooltip: `
            ${this.getTooltipRowString(currentPeriodTitle, currentVal, field.units ? field.units(data[index]) : config.units || '')}
            ${this.getTooltipRowString(comparePeriodTitle, compareVal, field.units ? field.units(compareData[index]) : config.units || '')}
          `,
          value: ReportHelper.numberOrZero(String(Math.abs(trend))),
          selected: header === (selected || config.preSelected),
          units: '%',
          key: header,
          trend: trend > 0 ? 1 : trend < 0 ? -1 : 0,
        });
      }
    });

    return tabsData;
  }

  private _calculateTrend(current: number, compare: number): number {

    if (current === 0 && compare === 0) {
      return 0;
    }

    if (current === 0 && compare > 0) {
      return -100;
    }

    if (compare === 0 && current > 0) {
      return 100;
    }
    return Math.ceil(((current - compare) / current) * 100);
  }
}

