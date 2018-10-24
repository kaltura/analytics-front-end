import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportGraph, KalturaReportInterval, KalturaReportTable, KalturaReportTotal } from 'kaltura-ngx-client';
import { ReportDataItemConfig } from 'shared/services/storage-data-base.config';
import { GraphsData } from 'shared/services/report.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';

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
      if (!config.fields[graph.id]) {
        return;
      }
      
      const currentData = graph.data.split(';');
      const compareData = compare[i].data.split(';');
      let values = [];
      let compareValues = [];
      let barChartValues = [];
      currentData.forEach((currentValue, j) => {
        const compareValue = compareData[j];
        if (currentValue.length && compareValue.length) {
          const currentLabel = currentValue.split(',')[0];
          const compareLabel = compareValue.split(',')[0];
          
          const currentName = reportInterval === KalturaReportInterval.months
            ? DateFilterUtils.formatMonthOnlyString(currentLabel, analyticsConfig.locale)
            : DateFilterUtils.formatShortDateString(currentLabel, analyticsConfig.locale);
          
          const compareName = reportInterval === KalturaReportInterval.months
            ? DateFilterUtils.formatMonthOnlyString(compareLabel, analyticsConfig.locale)
            : DateFilterUtils.formatShortDateString(compareLabel, analyticsConfig.locale);
          
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
          
          barChartValues.push({
            name: currentName, series: [
              { name: currentPeriodTitle, value: currentVal },
              { name: comparePeriodTitle, value: compareVal }
            ]
          });
          
          values.push({ name: currentName, value: currentVal });
          compareValues.push({ name: currentName, value: compareVal });
        }
      });
      barChartData[graph.id] = barChartValues;
      lineChartData[graph.id] = [
        { name: currentPeriodTitle, series: values },
        { name: comparePeriodTitle, series: compareValues },
      ];
      
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
    // parse table columns
    let columns = current.header.split(',');
    const tableData = [];
    
    // parse table data
    const currentData = current.data.split(';');
    const compareData = compare.data.split(';');

    currentData.forEach((valuesString, i) => {
      const compareValuesString = compareData[i];
      if (valuesString.length && compareValuesString.length) {
        let data = {};
        const currentValues = valuesString.split(',');
        const compareValues = compareValuesString.split(',');
  
        currentValues.forEach((value, j) => {
          const fieldConfig = config.fields[columns[j]];
          if (fieldConfig) {
            let result;
            if (fieldConfig.nonComparable) {
              result = fieldConfig.format(value);
            } else {
              const trend = this._calculateTrend(Number(value), Number(compareValues[j]));
              result = {
                value: fieldConfig.format(String(Math.abs(trend))),
                tooltip: `${fieldConfig.format(value)} – ${fieldConfig.format(compareValues[j])}`,
                trend: trend > 0 ? 1 : trend < 0 ? -1 : 0,
                units: '%'
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
          value: field.format(String(Math.abs(trend))),
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
    
    return Math.ceil(((current - compare) / current) * 100);
  }
}

