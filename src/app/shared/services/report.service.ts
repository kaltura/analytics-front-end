import { Injectable, OnDestroy } from '@angular/core';
import {
  KalturaClient,
  KalturaFilterPager,
  KalturaMultiResponse,
  KalturaReportBaseTotal,
  KalturaReportGraph,
  KalturaReportInputFilter,
  KalturaReportInterval,
  KalturaReportResponseOptions,
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
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

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

    const responseOptions: KalturaReportResponseOptions = new KalturaReportResponseOptions({
      delimiter: analyticsConfig.valueSeparator,
      skipEmptyDates: analyticsConfig.skipEmptyBuckets
    });

    return Observable.create(
      observer => {
        const getTotal = new ReportGetTotalAction({
          reportType: config.reportType,
          reportInputFilter: config.filter,
          objectIds: config.objectIds ? config.objectIds : null,
          responseOptions
        });
        
        const getGraphs = new ReportGetGraphsAction({
          reportType: config.reportType,
          reportInputFilter: config.filter,
          objectIds: config.objectIds ? config.objectIds : null,
          responseOptions
        });
        
        const getTable = new ReportGetTableAction({
          reportType: config.reportType,
          reportInputFilter: config.filter,
          pager: config.pager,
          order: config.order,
          objectIds: config.objectIds ? config.objectIds : null,
          responseOptions
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
                  this._frameEventManager.publish(FrameEvents.UpdateLayout, { 'height': document.getElementById('analyticsApp').getBoundingClientRect().height });
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
          trigger: 'axis',
          formatter: getFormatter(config.fields[graph.id].colors ? config.fields[graph.id].colors[0] : defaultColor),
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
      field => new KalturaReportGraph({ id: field, data: data.reduce((acc, val) => (acc += `${val.source}${analyticsConfig.valueSeparator}${val[field]};`, acc), '') })
    );
  }
  
  public tableFromGraph(graphs: KalturaReportGraph[],
                        config: ReportDataItemConfig,
                        period: { from: string, to: string },
                        reportInterval: KalturaReportInterval): { columns: string[], tableData: { [key: string]: string }[], totalCount: number } {
    const firstColumn = reportInterval === KalturaReportInterval.days ? 'date_id' : 'month_id';
    let columns = [];
    const data = [];
    
    graphs.forEach(item => {
      columns.push(item.id);
      data.push(item.data.split(';'));
    });
    
    const tableData = data[0].filter(Boolean).map((item, i) => {
      const initialValue = {
        [firstColumn]: config.fields[firstColumn]
          ? config.fields[firstColumn].format(item.split(analyticsConfig.valueSeparator)[0])
          : item.split(analyticsConfig.valueSeparator)[0]
      };
      return columns.reduce(
        (acc, val, j) => {
          acc[val] = config.fields[val]
            ? config.fields[val].format(data[j][i].split(analyticsConfig.valueSeparator)[1])
            : data[j][i].split(analyticsConfig.valueSeparator)[1];
          return acc;
        },
        initialValue
      );
    });
  
    columns = columns.filter(header => config.fields.hasOwnProperty(header) && !config.fields[header].hidden);
    columns.sort((a, b) => {
      const valA = config.fields[a].sortOrder || 0;
      const valB = config.fields[b].sortOrder || 0;
      return valA - valB;
    });
    columns = [firstColumn, ...columns];
  
    return { tableData, columns, totalCount: tableData.length };
  }
}

