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
import { catchError, timeout } from 'rxjs/operators';
import { TimeoutError } from 'rxjs';

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
              private _kalturaClient: KalturaClient) {
  }
  
  private _responseIsType(response: KalturaResponse<any>, type: any): boolean {
    return response.result instanceof type
      || Array.isArray(response.result) && response.result.length && response.result[0] instanceof type;
  }
  
  public getReport(config: ReportConfig, sections: ReportDataConfig, preventMultipleRequests = true): Observable<Report> {
    sections = sections === null ? { table: null } : sections; // table is mandatory section
    
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
                setTimeout(() => {
                  this._frameEventManager.publish(FrameEvents.UpdateLayout, {'height': document.getElementById('analyticsApp').getBoundingClientRect().height});
                }, 0);
              }
              this._querySubscription = null;
            },
            error => {
              observer.error(error);
              this._querySubscription = null;
            });
      }).pipe(
        timeout(analyticsConfig.kalturaServer.failRequestTimeout),
        catchError(error => {
          if (error instanceof TimeoutError) {
            throw Error(this._translate.instant('app.errors.failedRequestTimeout'));
          }
          throw Error(error.message);
        })
    );
  }
  
  public exportToCsv(args: ReportGetUrlForReportAsCsvActionArgs): Observable<string> {
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
            },
            error => {
              observer.error(error);
              this._exportSubscription = null;
            });
      });
  }
  
  
  ngOnDestroy() {
  }
  
  public parseTableData(table: KalturaReportTable, config: ReportDataItemConfig): { columns: string[], tableData: { [key: string]: string }[] } {
    // parse table columns
    let columns = table.header.toLowerCase().split(analyticsConfig.valueSeparator);
    const tableData = [];
    
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
                     reportInterval: KalturaReportInterval,
                     dataLoadedCb?: Function,
                     graphOptions?: { xAxisLabelRotation?: number, yAxisLabelRotation?: number }): GraphsData {
    let lineChartData = {};
    let barChartData = {};
    graphs.forEach((graph: KalturaReportGraph) => {
      if (!config.fields[graph.id]) {
        return;
      }
      let xAxisData = [];
      let yAxisData = [];
      const data = graph.data.split(';');
      
      data.forEach((value) => {
        if (value.length) {
          const label = value.split(analyticsConfig.valueSeparator)[0];
          let name = label;
  
          if (!config.fields[graph.id].nonDateGraphLabel) {
            name = reportInterval === KalturaReportInterval.months
              ? DateFilterUtils.formatMonthString(label, analyticsConfig.locale)
              : DateFilterUtils.formatFullDateString(label, analyticsConfig.locale);
          }
          let val = parseFloat(value.split(analyticsConfig.valueSeparator)[1]);
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
                               reportInterval: KalturaReportInterval,
                               graphOptions?: { xAxisLabelRotation?: number, yAxisLabelRotation?: number }) {
    const { tableData } = this.parseTableData(table, dataConfig.table);
    const graphData = this.convertTableDataToGraphData(tableData, dataConfig);
    return this.parseGraphs(graphData, dataConfig.graph, reportInterval, null, graphOptions);
  }
  
  
  public convertTableDataToGraphData(data: { [key: string]: string }[], dataConfig: ReportDataConfig): KalturaReportGraph[] {
    return Object.keys(dataConfig.graph.fields).map(
      field => new KalturaReportGraph({ id: field, data: data.reduce((acc, val) => (acc += `${val.source},${val[field]};`, acc), '') })
    );
  }
}

