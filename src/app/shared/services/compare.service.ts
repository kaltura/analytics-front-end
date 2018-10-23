import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportGraph, KalturaReportInterval, KalturaReportTotal } from 'kaltura-ngx-client';
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
  
  public compareGraphData(current: KalturaReportGraph[],
                          compare: KalturaReportGraph[],
                          config: ReportDataItemConfig,
                          reportInterval: KalturaReportInterval,
                          dataLoadedCb?: Function): GraphsData {
    const lineChartData = {};
    const barChartData = {};

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
              { name: 'Value1', value: currentVal },
              { name: 'Value2', value: compareVal }
            ]
          });

          values.push({ name: currentName, value: currentVal });
          compareValues.push({ name: currentName, value: compareVal });
        }
      });
      barChartData[graph.id] = barChartValues;
      lineChartData[graph.id] = [
        { name: 'Value1', series: values },
        { name: 'Value2', series: compareValues },
      ];
      
      if (typeof dataLoadedCb === 'function') {
        setTimeout(() => {
          dataLoadedCb();
        }, 200);
      }
    });
    
    return { barChartData, lineChartData };
  }
  
  public compareTableData(current, compare): any {
    return [];
  }
  
  public compareTotalsData(current: KalturaReportTotal, compare: KalturaReportTotal, config: ReportDataItemConfig, selected?: string): Tab[] {
    const tabsData = [];
    const data = current.data.split(',');
    const compareData = compare.data.split(',');
  
    current.header.split(',').forEach( (header, index) => {
      const field = config.fields[header];
      if (field) {
        const trend = this._calculateTrend(data[index], compareData[index]);
        const currentVal = field.format(data[index]);
        const compareVal = field.format(compareData[index]);
        tabsData.push({
          title: field.title,
          tooltip: `${currentVal} – ${compareVal}`,
          value: field.format(String(trend)),
          selected: header === (selected || config.preSelected),
          units: '%',
          key: header
        });
      }
    });
  
    return tabsData;
  }
  
  private _calculateTrend(current, compare): number {
    if (current === 0) {
      return 0; // todo
    }
  
    return Math.ceil(((current - compare) / current) * 100);
  }
}

