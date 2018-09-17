import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient, KalturaReportInputFilter, KalturaReportType, ReportGetTotalAction, KalturaReportTotal, ReportGetGraphsAction,
  KalturaReportGraph, ReportGetTableAction, KalturaFilterPager, KalturaMultiResponse, KalturaReportTable,
  ReportGetUrlForReportAsCsvAction, ReportGetUrlForReportAsCsvActionArgs, ReportGetBaseTotalAction, KalturaReportBaseTotal} from 'kaltura-ngx-client';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

export type Report = {
  totals: KalturaReportTotal,
  graphs: KalturaReportGraph[],
  table: KalturaReportTable
};

@Injectable()
export class ReportService implements OnDestroy {

  private _querySubscription: ISubscription;
  private _exportSubscription: ISubscription;

  constructor(private _translate: TranslateService, private _kalturaClient: KalturaClient) {
  }

  public getReport(tableOnly: boolean, loadBaseTotals: boolean, reportType: KalturaReportType, filter: KalturaReportInputFilter, pager: KalturaFilterPager, order: string): Observable<Report> {
    return Observable.create(
      observer => {
        const getTotal = new ReportGetTotalAction({
          reportType,
          reportInputFilter: filter
        });

        const getGraphs = new ReportGetGraphsAction({
          reportType,
          reportInputFilter: filter
        });

        const getBaseTotals = new ReportGetBaseTotalAction({
          reportType,
          reportInputFilter: filter
        });

        const getTable = new ReportGetTableAction({
          reportType,
          reportInputFilter: filter,
          pager,
          order
        });

        if (this._querySubscription) {
          this._querySubscription.unsubscribe();
          this._querySubscription = null;
        }

        const request = tableOnly ? [getTable] : loadBaseTotals ? [getTable, getGraphs, getTotal, getBaseTotals] : [getTable, getGraphs, getTotal];
        this._querySubscription = this._kalturaClient.multiRequest(request)
          .pipe(cancelOnDestroy(this))
          .subscribe((response: KalturaMultiResponse) => {
              if (response.hasErrors()) {
                observer.error(this._translate.instant('app.errors.general'));
              } else {
                const report: Report = {
                  table: response[0].result,
                  graphs: response[1] ? response[1].result : [],
                  totals: response[2] ? response[2].result : null
                };
                if (loadBaseTotals) {
                  const baseTotals = response[3] ? response[3].result : [];
                  this.addTotals(report, baseTotals);
                }
                observer.next(report);
                observer.complete();
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

  private addTotals(report: Report,  totals: KalturaReportBaseTotal[]): void {
    totals.forEach( (total: KalturaReportBaseTotal) => {
      let newGraph = new KalturaReportGraph({id: total.id, data: ''});
      const metrics = total.id.substr(6);
      const added_data_graph: KalturaReportGraph = report.graphs.find( (graph: KalturaReportGraph) => {
        return graph.id === 'added_' + metrics;
      });
      const deleted_data_graph: KalturaReportGraph = report.graphs.find( (graph: KalturaReportGraph) => {
        return graph.id === 'deleted_' + metrics;
      });
      if (typeof added_data_graph !== 'undefined' && typeof deleted_data_graph !== 'undefined') {
        const totalValue = parseFloat(total.data);
        // TODO create data here
        // report.graphs.push(newGraph);
      }
    });
  }

  ngOnDestroy() {
  }


}

