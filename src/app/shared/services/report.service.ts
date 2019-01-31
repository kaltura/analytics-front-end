import { Injectable, OnDestroy } from '@angular/core';
import {
  KalturaClient,
  KalturaFilterPager,
  KalturaMultiResponse,
  KalturaReportBaseTotal,
  KalturaReportGraph,
  KalturaReportInputFilter,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportTotal,
  KalturaReportType,
  KalturaRequest,
  KalturaResponse,
  ReportGetGraphsAction,
  ReportGetTableAction,
  ReportGetTotalAction,
  ReportGetUrlForReportAsCsvAction,
  ReportGetUrlForReportAsCsvActionArgs
} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { ReportDataConfig, ReportDataItemConfig } from 'shared/services/storage-data-base.config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { getPrimaryColor } from 'shared/utils/colors';
import * as moment from 'moment';
import { enumerateMonthsBetweenDates } from 'shared/utils/enumerateMonthsBetweenDates';
import { enumerateDaysBetweenDates } from 'shared/utils/enumerateDaysBetweenDates';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { st } from '@angular/core/src/render3';

export type ReportConfig = {
  reportType: KalturaReportType,
  filter: KalturaReportInputFilter,
  pager: KalturaFilterPager,
  order: string,
  objectIds?: string
};

export type Report = {
  totals: KalturaReportTotal,
  graphs: KalturaReportGraph[],
  table: KalturaReportTable,
  baseTotals?: KalturaReportBaseTotal[]
};

export interface AccumulativeData {
  value: string;
  label: string;
  units: string;
}

export interface GraphsData {
  lineChartData: { [key: string]: { name: string, series: { name: string, value: string } }[] };
  barChartData: { [key: string]: { name: string, value: string }[] };
}

@Injectable()
export class ReportService implements OnDestroy {
  
  private _querySubscription: ISubscription;
  private _exportSubscription: ISubscription;
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _logger: KalturaLogger) {
    this._logger = _logger.subLogger('ReportService');
  }
  
  private _responseIsType(response: KalturaResponse<any>, type: any): boolean {
    return response.result instanceof type
      || Array.isArray(response.result) && response.result.length && response.result[0] instanceof type;
  }
  
  public getReport(config: ReportConfig, sections: ReportDataConfig, preventMultipleRequests = true): Observable<Report> {
    sections = sections === null ? { table: null } : sections; // table is mandatory section
    const logger = this._logger.subLogger(`Report #${config.reportType}`);
    logger.info('Request report from the server', { reportType: config.reportType, sections: Object.keys(sections) });
    
    return Observable.create(
      observer => {
        const getTotal = new ReportGetTotalAction({
          reportType: config.reportType,
          reportInputFilter: config.filter,
          objectIds: config.objectIds ? config.objectIds : null
        });
        
        const getGraphs = new ReportGetGraphsAction({
          reportType: config.reportType,
          reportInputFilter: config.filter,
          objectIds: config.objectIds ? config.objectIds : null
        });
        
        const getTable = new ReportGetTableAction({
          reportType: config.reportType,
          reportInputFilter: config.filter,
          pager: config.pager,
          order: config.order,
          objectIds: config.objectIds ? config.objectIds : null
        });
        
        if (this._querySubscription && preventMultipleRequests) {
          logger.info('Another report request is in progress, cancel previous one');
          this._querySubscription.unsubscribe();
          this._querySubscription = null;
        }
        
        let request: KalturaRequest<any>[] = [getTable];
        
        if (sections.graph) {
          request.push(getGraphs);
        }
        
        if (sections.totals) {
          request.push(getTotal);
        }
        
        this._querySubscription = this._kalturaClient.multiRequest(request)
          .pipe(cancelOnDestroy(this))
          .subscribe((responses: KalturaMultiResponse) => {
              if (responses.hasErrors()) {
                const err = responses.getFirstError();
                if (err) {
                  observer.error(err);
                } else {
                  observer.error(this._translate.instant('app.errors.general'));
                }
              } else {
                let report: Report = {
                  table: null,
                  graphs: [],
                  totals: null
                };
                responses.forEach(response => {
                  if (this._responseIsType(response, KalturaReportTable)) {
                    report.table = response.result;
                  } else if (this._responseIsType(response, KalturaReportTotal)) {
                    report.totals = response.result;
                  } else if (this._responseIsType(response, KalturaReportGraph)) {
                    report.graphs = response.result;
                  } else if (this._responseIsType(response, KalturaReportBaseTotal)) {
                    report.baseTotals = response.result;
                  }
                });
                observer.next(report);
                observer.complete();
  
                logger.info('Report has loaded');
                
                setTimeout(() => {
                  this._frameEventManager.publish(FrameEvents.UpdateLayout, {'height': document.getElementById('analyticsApp').getBoundingClientRect().height});
                }, 0);
              }
              this._querySubscription = null;
            },
            error => {
              logger.error('Report loading has failed', error);
              observer.error(error);
              this._querySubscription = null;
            });
      });
  }
  
  public exportToCsv(args: ReportGetUrlForReportAsCsvActionArgs): Observable<string> {
    const logger = this._logger.subLogger(`Report #${args.reportType}`);
    logger.info('Request for export csv link', { title: args.reportTitle });
    return Observable.create(
      observer => {
        const exportAction = new ReportGetUrlForReportAsCsvAction(args);
        
        if (this._exportSubscription) {
          this._exportSubscription.unsubscribe();
          this._exportSubscription = null;
        }
        
        this._exportSubscription = this._kalturaClient.request(exportAction)
          .pipe(cancelOnDestroy(this))
          .subscribe((response: string) => {
              observer.next(response);
              observer.complete();
              this._exportSubscription = null;
              logger.info('Export request successful', { url: response });
            },
            error => {
              observer.error(error);
              this._exportSubscription = null;
              logger.error('Failed to export csv', error);
            });
      });
  }
  
  
  ngOnDestroy() {
  }
  
  public parseTableData(table: KalturaReportTable, config: ReportDataItemConfig): { columns: string[], tableData: { [key: string]: string }[] } {
    // parse table columns
    let columns = table.header.toLowerCase().split(analyticsConfig.valueSeparator);
    const tableData = [];
  
    this._logger.trace('Parse table data', { headers: table.header });
    
    // parse table data
    table.data.split(';').forEach(valuesString => {
      if (valuesString.length) {
        let data = {};
        valuesString.split(analyticsConfig.valueSeparator).forEach((value, index) => {
          if (config.fields[columns[index]]) {
            data[columns[index]] = config.fields[columns[index]].format(value);
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
  
  public parseTotals(totals: KalturaReportTotal | KalturaReportTable, config: ReportDataItemConfig, selected?: string): Tab[] {
    const tabsData = [];
    const data = totals.data.split(analyticsConfig.valueSeparator);
  
    this._logger.trace('Parse totals data', { headers: totals.header });

    totals.header.split(analyticsConfig.valueSeparator).forEach((header, index) => {
      const field = config.fields[header];
      if (field) {
        tabsData.push({
          title: field.title,
          tooltip: field.tooltip,
          value: field.format(data[index]),
          rawValue: data[index],
          selected: header === (selected || config.preSelected),
          units: field.units ? field.units(data[index]) : (config.units || ''),
          key: header,
          sortOrder: field.sortOrder || 0,
        });
      }
    });
    
    return tabsData.sort((a, b) => {
      return a.sortOrder - b.sortOrder;
    });
  }
  
  private _getMissingDatesValues(startDate: moment.Moment,
                                 endDate: moment.Moment,
                                 reportInterval: KalturaReportInterval,
                                 formatFn: Function): { name: string, value: number }[] {
    const dates = reportInterval === KalturaReportInterval.days
      ? enumerateDaysBetweenDates(startDate, endDate)
      : enumerateMonthsBetweenDates(startDate, endDate);
  
    this._logger.debug('Get missing dates for', () => ({
      startDate: startDate.format('YYYYMMDD'),
      endDate: endDate.format('YYYYMMDD'),
      interval: reportInterval,
    }));
    
    return dates.map(date => {
      const name = reportInterval === KalturaReportInterval.months
        ? DateFilterUtils.formatMonthString(date.format('YYYYMMDD'), analyticsConfig.locale)
        : DateFilterUtils.formatFullDateString(date.format('YYYYMMDD'), analyticsConfig.locale);
      const value = typeof formatFn === 'function' ? formatFn(0) : 0;
      
      return { name, value };
    });
  }
  
  public parseGraphs(graphs: KalturaReportGraph[],
                     config: ReportDataItemConfig,
                     period: { from: string, to: string },
                     reportInterval: KalturaReportInterval,
                     dataLoadedCb?: Function,
                     graphOptions?: { xAxisLabelRotation?: number, yAxisLabelRotation?: number }): GraphsData {
    this._logger.trace(
      'Parse graph data',
      () => ({ period, reportInterval, graphIds: graphs.map(({ id }) => id).join(', ') })
    );
    
    let lineChartData = {};
    let barChartData = {};
    graphs.forEach((graph: KalturaReportGraph) => {
      if (!config.fields[graph.id]) {
        return;
      }
      let xAxisData = [];
      let yAxisData = [];
      const data = graph.data.split(';');
  
      if (!config.fields[graph.id].nonDateGraphLabel) {
        let fromDate = DateFilterUtils.parseDateString(period.from);
        let currentDate = DateFilterUtils.parseDateString((data[0] || '').split(analyticsConfig.valueSeparator)[0] || '');

        if (reportInterval === KalturaReportInterval.days) {
          fromDate = fromDate.clone().startOf('day');
          currentDate = currentDate.clone().startOf('day');
        } else {
          fromDate = fromDate.clone().startOf('month');
          currentDate = currentDate.clone().startOf('month');
        }

        if (fromDate.isBefore(currentDate)) {
          this._logger.debug('Graphs period starts before first date in the response – fill missing dates with zeros', {
            startDate: currentDate,
            correctStartDate: fromDate
          });
          this._getMissingDatesValues(fromDate, currentDate, reportInterval, config.fields[graph.id].format)
            .forEach(result => {
              xAxisData.push(result.name);
              yAxisData.push(result.value);
            });
        }
      } else {
        this._logger.debug('Graph label is not a date, skip start date manipulations');
      }
      
      data.forEach((value, index) => {
        if (value.length) {
          const label = value.split(analyticsConfig.valueSeparator)[0];
          let name = label;
          
          if (!config.fields[graph.id].nonDateGraphLabel) {
            name = reportInterval === KalturaReportInterval.months
              ? DateFilterUtils.formatMonthString(label, analyticsConfig.locale)
              : DateFilterUtils.formatFullDateString(label, analyticsConfig.locale);
          } else {
            this._logger.debug('Graph label is not a date, skip label formatting according to time interval');
          }

          let val: string | number = value.split(analyticsConfig.valueSeparator)[1];
  
          if (config.fields[graph.id] && config.fields[graph.id].parse) {
            val = config.fields[graph.id].parse(val);
          } else {
            val = parseFloat(val);
          }

          if (isNaN(val)) {
            val = 0;
          }
          
          if (config.fields[graph.id]) {
            val = config.fields[graph.id].format(val);
          }
          
          xAxisData.push(name);
          yAxisData.push(val);
  
          if (!config.fields[graph.id].nonDateGraphLabel) {
            const nextValue = data[index + 1];
            
            if (nextValue) {
              let nextValueDate, actualNextValueDate;
              if (reportInterval === KalturaReportInterval.days) {
                nextValueDate = moment(nextValue.split(analyticsConfig.valueSeparator)[0]).startOf('day');
                actualNextValueDate = moment(label).startOf('day').add(1, 'days');
              } else {
                nextValueDate = DateFilterUtils.parseDateString(nextValue.split(analyticsConfig.valueSeparator)[0]).startOf('month');
                actualNextValueDate = DateFilterUtils.parseDateString(label).startOf('month').add(1, 'months');
              }
    
              if (!actualNextValueDate.isSame(nextValueDate)) {
                this._logger.debug('Next date is not correct – fill missing dates with zeros', {
                  nextDate: actualNextValueDate,
                  correctNextDate: nextValueDate,
                });
                this._getMissingDatesValues(actualNextValueDate, nextValueDate, reportInterval, config.fields[graph.id].format)
                  .forEach(result => {
                    xAxisData.push(result.name);
                    yAxisData.push(result.value);
                  });
              }
            } else {
              let currentDate = DateFilterUtils.parseDateString(label);
              let toDate = DateFilterUtils.parseDateString(period.to);
  
              if (reportInterval === KalturaReportInterval.days) {
                toDate = toDate.clone().startOf('day');
                currentDate = currentDate.clone().startOf('day');
              } else {
                toDate = toDate.clone().startOf('month');
                currentDate = currentDate.clone().startOf('month');
              }

              if (currentDate.isBefore(toDate)) {
                toDate = toDate.clone().add(1, reportInterval === KalturaReportInterval.days ? 'days' : 'months');

                this._logger.debug('Graphs period ends after last date in the response – fill missing dates with zeros', {
                  endDate: currentDate,
                  correctEndDate: toDate,
                });

                this._getMissingDatesValues(currentDate, toDate, reportInterval, config.fields[graph.id].format)
                  .forEach(result => {
                    xAxisData.push(result.name);
                    yAxisData.push(result.value);
                  });
              }
            }
          } else {
            this._logger.debug('Graph label is not a date, skip end date manipulations');
          }
        }
      });
      const defaultColor = getPrimaryColor();
      const getFormatter = color => params => {
        const { name, value } = Array.isArray(params) ? params[0] : params;
        const formattedValue = typeof config.fields[graph.id].graphTooltip === 'function'
          ? config.fields[graph.id].graphTooltip(value)
          : value;
        return `
          <div class="kGraphTooltip">
            ${name}<br/>
            <span class="kBullet" style="color: ${color}">&bull;</span>&nbsp;
            ${formattedValue}
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
          top: 24, left: 24, bottom: 24, right: 24, containLabel: true
        },
        color: [config.fields[graph.id].colors ? config.fields[graph.id].colors[0] : defaultColor],
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
          formatter: getFormatter(config.fields[graph.id].colors ? config.fields[graph.id].colors[0] : defaultColor),
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
        series: [{
          data: yAxisData,
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
          top: 24, left: 24, bottom: 24, right: 24, containLabel: true
        },
        color: [config.fields[graph.id].colors ? config.fields[graph.id].colors[0] : defaultColor],
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
          formatter: getFormatter(config.fields[graph.id].colors ? config.fields[graph.id].colors[0] : defaultColor),
          backgroundColor: '#ffffff',
          borderColor: '#dadada',
          borderWidth: 1,
          extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
          textStyle: {
            color: '#999999'
          }
        },
        series: [{
          data: yAxisData,
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
  
  public getGraphDataFromTable(table: KalturaReportTable,
                               dataConfig: ReportDataConfig,
                               period: { from: string, to: string },
                               reportInterval: KalturaReportInterval,
                               graphOptions?: { xAxisLabelRotation?: number, yAxisLabelRotation?: number }) {
    this._logger.trace('Parse graph data from table data', { headers: table.header, period });

    const { tableData } = this.parseTableData(table, dataConfig.table);
    const graphData = this.convertTableDataToGraphData(tableData, dataConfig);
    return this.parseGraphs(graphData, dataConfig.graph, period, reportInterval, null, graphOptions);
  }
  
  
  public convertTableDataToGraphData(data: { [key: string]: string }[], dataConfig: ReportDataConfig): KalturaReportGraph[] {
    this._logger.trace('Convert table data to graph data', { graphIds: Object.keys(dataConfig.graph.fields) });
    return Object.keys(dataConfig.graph.fields).map(
      field => new KalturaReportGraph({ id: field, data: data.reduce((acc, val) => (acc += `${val.source},${val[field]};`, acc), '') })
    );
  }
}

