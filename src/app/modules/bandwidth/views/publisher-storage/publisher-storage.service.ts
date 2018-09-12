import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient, KalturaReportInputFilter, KalturaReportType, ReportGetTotalAction, KalturaReportTotal } from 'kaltura-ngx-client';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

export type Report = {
  totals: KalturaReportTotal
};

@Injectable()
export class PublisherStorageService implements OnDestroy {

    private _querySubscription: ISubscription;

    constructor(private _kalturaClient: KalturaClient) {
    }

  public getReport(filter: KalturaReportInputFilter): Observable<Report> {
    return Observable.create(
      observer => {
        const getTotal = new ReportGetTotalAction({
          reportType: KalturaReportType.partnerUsage,
          reportInputFilter: filter
        });

        if (this._querySubscription) {
          this._querySubscription.unsubscribe();
          this._querySubscription = null;
        }

        this._querySubscription = this._kalturaClient.request(getTotal)
          .pipe(cancelOnDestroy(this))
          .subscribe(result => {
              const report: Report = {totals: result};
              observer.next(report);
              observer.complete();
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

