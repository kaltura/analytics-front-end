import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient, KalturaReportInputFilter, KalturaReportType, ReportGetTotalAction, KalturaReportTotal, ReportGetGraphsAction, KalturaReportGraph, ReportGetTableAction, KalturaFilterPager, KalturaMultiResponse, KalturaReportTable } from 'kaltura-ngx-client';
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
export class PublisherStorageService implements OnDestroy {

  private _querySubscription: ISubscription;

  constructor(private _translate: TranslateService, private _kalturaClient: KalturaClient) {
  }

  public getReport(tableOnly: boolean, filter: KalturaReportInputFilter, pager: KalturaFilterPager, order: string): Observable<Report> {
    return Observable.create(
      observer => {
        const getTotal = new ReportGetTotalAction({
          reportType: KalturaReportType.partnerUsage,
          reportInputFilter: filter
        });

        const getGraphs = new ReportGetGraphsAction({
          reportType: KalturaReportType.partnerUsage,
          reportInputFilter: filter
        });


        const getTable = new ReportGetTableAction({
          reportType: KalturaReportType.partnerUsage,
          reportInputFilter: filter,
          pager,
          order
        });

        if (this._querySubscription) {
          this._querySubscription.unsubscribe();
          this._querySubscription = null;
        }

        const request = tableOnly ? [getTable] : [getTable, getGraphs, getTotal];
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
                observer.next(report);
                observer.complete();
              }
              this._querySubscription = null;
            },
            error => {
              observer.error(error);
              this._querySubscription = null;
            });

        return () => {
          console.log('PublisherStorageService.getReport(): cancelled');
          this._querySubscription.unsubscribe();
        };

      });
  }

  ngOnDestroy() {
  }


}

