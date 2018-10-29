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
        color: ['#F49616', '#FCDBA3'],
        xAxis: {
          type: 'category',
          data: xAxisData
        },
        yAxis: {
          type: 'value'
        },
        tooltip: {},
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

      if (reportInterval === KalturaReportInterval.days) {
        lineChartData[graph.id].dataZoom = [{
          type: 'inside',
          start: 0,
          end: 100
        }, {
          start: 0,
          end: 10,
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%',
          handleStyle: {
            color: '#fff',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowOffsetX: 2,
            shadowOffsetY: 2
          }
        }];
      }

      if (typeof dataLoadedCb === 'function') {
        setTimeout(() => {
          dataLoadedCb();
        }, 200);
      }
    });

    return { barChartData, lineChartData };
  }

  public compareTableData(current: KalturaReportTable,
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
              const trend = hasConsistentData ? Math.abs(this._calculateTrend(Number(value), Number(compareValues[j]))) : 0;
              result = {
                value: hasConsistentData ? fieldConfig.format(String(trend)) : 'N/A',
                tooltip: `${ReportHelper.numberOrZero(value)} – ${hasConsistentData ? ReportHelper.numberOrZero(compareValues[j]) : 'N/A'}`,
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

  public compareTotalsData(current: KalturaReportTotal, compare: KalturaReportTotal, config: ReportDataItemConfig, selected?: string): Tab[] {
    if (!current.header || !current.data || !compare.header || !compare.data) {
      return;
    }

    const tabsData = [];
    const data = current.data.split(',');
    const compareData = compare.data.split(',');

    current.header.split(',').forEach((header, index) => {
      const field = config.fields[header];
      if (field) {
        const trend = this._calculateTrend(Number(data[index]), Number(compareData[index]));
        const currentVal = field.format(data[index]);
        const compareVal = field.format(compareData[index]);
        tabsData.push({
          title: field.title,
          tooltip: `${currentVal} – ${compareVal}`,
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

