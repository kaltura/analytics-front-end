import { Injectable, OnDestroy } from '@angular/core';
import {
  KalturaClient, KalturaReportInputFilter, KalturaReportType, ReportGetTotalAction, KalturaReportTotal, ReportGetGraphsAction,
  KalturaReportGraph, ReportGetTableAction, KalturaFilterPager, KalturaMultiResponse, KalturaReportTable,
  ReportGetUrlForReportAsCsvAction, ReportGetUrlForReportAsCsvActionArgs, ReportGetBaseTotalAction, KalturaReportBaseTotal, KalturaReportInterval, KalturaResponse, KalturaObjectBase, KalturaRequest
} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { Tab } from 'shared/components/report-tabs/report-tabs.component';
import { ReportDataConfig, ReportDataItemConfig } from 'shared/services/storage-data-base.config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';

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
  lineChartData: { [key: string]: {name: string, series: { name: string, value: string } }[]};
  barChartData: { [key: string]: { name: string, value: string }[] };
}

@Injectable()
export class ReportService implements OnDestroy {

  private _querySubscription: ISubscription;
  private _exportSubscription: ISubscription;

  constructor(private _translate: TranslateService, private _kalturaClient: KalturaClient) {
  }

  private _responseIsType(response: KalturaResponse<any>, type: any): boolean {
    return response.result instanceof type
      || Array.isArray(response.result) && response.result.length && response.result[0] instanceof type;
  }

  public getReport(config: ReportConfig, sections: ReportDataConfig, loadBaseTotals: boolean = false): Observable<Report> {
    sections = sections === null ? { table: null } : sections; // table is mandatory section

    return Observable.create(
      observer => {
        const getTotal = new ReportGetTotalAction({
          reportType : config.reportType,
          reportInputFilter: config.filter,
          objectIds: config.objectIds ? config.objectIds : null
        });

        const getGraphs = new ReportGetGraphsAction({
          reportType: config.reportType,
          reportInputFilter: config.filter,
          objectIds: config.objectIds ? config.objectIds : null
        });

        const getBaseTotals = new ReportGetBaseTotalAction({
          reportType: config.reportType,
          reportInputFilter: config.filter
        });

        const getTable = new ReportGetTableAction({
          reportType: config.reportType,
          reportInputFilter: config.filter,
          pager: config.pager,
          order: config.order,
          objectIds: config.objectIds ? config.objectIds : null
        });

        if (this._querySubscription) {
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

        if (loadBaseTotals) {
          request.push(getBaseTotals);
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
                if ( analyticsConfig.callbacks && analyticsConfig.callbacks.updateLayout ) {
                  analyticsConfig.callbacks.updateLayout();
                }
              }
              this._querySubscription = null;
            },
            error => {
              observer.error(error);
              this._querySubscription = null;
            });
      });
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

  public addGraphTotals(graphs: KalturaReportGraph[], totals: KalturaReportBaseTotal[]): void {
    totals.forEach( (total: KalturaReportBaseTotal) => {
      let newGraph = new KalturaReportGraph({id: total.id, data: ''});
      const metrics = total.id.substr(6);
      const added_data_graph: KalturaReportGraph = graphs.find( (graph: KalturaReportGraph) => {
        return graph.id === 'added_' + metrics;
      });
      const deleted_data_graph: KalturaReportGraph = graphs.find( (graph: KalturaReportGraph) => {
        return graph.id === 'deleted_' + metrics;
      });
      if (typeof added_data_graph !== 'undefined' && typeof deleted_data_graph !== 'undefined') {
        const totalValue = parseFloat(total.data);
        const added_data = added_data_graph.data.split(';');
        const deleted_data = deleted_data_graph.data.split(';');
        let totalAdded = 0;
        let totalDeleted = 0;
        added_data.forEach( (dataSet, index) => {
          if (dataSet.split(',').length === 2 && deleted_data[index] && deleted_data[index].split(',').length === 2) {
            const addedXvalue = dataSet.split(',')[0];
            const addedYvalue = dataSet.split(',')[1];
            const deletedXvalue = deleted_data[index].split(',')[0];
            const deletedYvalue = deleted_data[index].split(',')[1];
            totalAdded += parseFloat(addedYvalue);
            totalDeleted += parseFloat(deletedYvalue);
            const calculatedValue = totalValue + totalAdded - totalDeleted;
            newGraph.data += addedXvalue + ',' + calculatedValue + ';';
          }
        });
        if (newGraph.data.length > 0) {
          graphs.push(newGraph);
        }
      }
    });
  }

  public addTableTotals(report: Report): { headers: string,  data: string } {
    let tableHeaders = report.table.header.split(',');
    let tableData = report.table.data.split(';');
    let newTableData = '';
    report.baseTotals.forEach( (total: KalturaReportBaseTotal) => {
      const metrics = total.id.substr(6);
      const totalValue = parseFloat(total.data);
      if (report.table.header.indexOf(total.id) === -1) {
        const index = tableHeaders.indexOf('deleted_' + metrics);
        if (index > -1) {
          let totalAdded = 0;
          let totalDeleted = 0;
          tableHeaders.splice(index + 1, 0, total.id);
          tableData.forEach((dataSet, ind) => {
            if (dataSet && dataSet.length) {
              let dataArr = dataSet.split(',');
              totalDeleted += parseFloat(dataArr[index]);
              totalAdded += parseFloat(dataArr[index - 1]);
              dataArr.splice(index + 1, 0, (totalValue + totalAdded - totalDeleted).toString());
              tableData[ind] = dataArr.join(',');
            }
          });
          newTableData = tableData.join(';');
        }
      }
    });
    return {headers: tableHeaders.join(','), data: newTableData};
  }


  ngOnDestroy() {
  }

  public parseTableData(table: KalturaReportTable, config: ReportDataItemConfig): { columns: string[], tableData: { [key: string]: string }[] } {
    // parse table columns
    let columns = table.header.toLowerCase().split(',');
    const tableData = [];

    // parse table data
    table.data.split(';').forEach( valuesString => {
      if (valuesString.length) {
        let data = {};
        valuesString.split(',').forEach((value, index) => {
          if (config.fields[columns[index]]) {
            data[columns[index]] = config.fields[columns[index]].format(value);
          }
        });
        tableData.push(data);
      }
    });

    columns = columns.filter(header => config.fields.hasOwnProperty(header));

    return { columns, tableData };
  }

  public parseTotals(totals: KalturaReportTotal, config: ReportDataItemConfig, selected?: string): Tab[] {
    const tabsData = [];
    const data = totals.data.split(',');

    totals.header.split(',').forEach( (header, index) => {
      const field = config.fields[header];
      if (field) {
        tabsData.push({
          title: field.title,
          tooltip: field.tooltip,
          value: field.format(data[index]),
          selected: header === (selected || config.preSelected),
          units: field.units ? field.units(data[index]) : (config.units || ''),
          key: header
        });
      }
    });

    return tabsData;
  }

  public parseGraphs(graphs: KalturaReportGraph[],
                     config: ReportDataItemConfig,
                     reportInterval: KalturaReportInterval,
                     dataLoadedCb?: Function): GraphsData {
    let lineChartData = {};
    let barChartData = {};
    graphs.forEach( (graph: KalturaReportGraph) => {
      if (!config.fields[graph.id]) {
        return;
      }
      let xAxisData = [];
      let yAxisData = [];
      const data = graph.data.split(';');

      data.forEach((value) => {
        if (value.length) {
          const label = value.split(',')[0];
          const name = reportInterval === KalturaReportInterval.months
            ? DateFilterUtils.formatMonthString(label, analyticsConfig.locale)
            : DateFilterUtils.formatFullDateString(label, analyticsConfig.locale);
          let val = Math.ceil(parseFloat(value.split(',')[1])); // publisher storage report should round up graph values
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
      lineChartData[graph.id] = {
        grid: {
          top: 24, left: 54, bottom: 24, right: 24
        },
        color: ['#F49616', '#149CC1'],
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
        series: [{
          data: yAxisData,
          type: 'line'
        }]
      };
      barChartData[graph.id] = {
        grid: {
          top: 24, left: 54, bottom: 24, right: 24
        },
        color: ['#00a784'],
        xAxis: {
          type: 'category',
          data: xAxisData
        },
        yAxis: {
          type: 'value'
        },
        tooltip: {},
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
}

