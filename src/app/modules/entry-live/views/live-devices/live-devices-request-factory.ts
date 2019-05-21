import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';

export class LiveDevicesRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.platformsRealtime,
    reportInputFilter: new KalturaEndUserReportInputFilter({
      toDate: this._getTime(0),
      fromDate: this._getTime(1),
    }),
    pager: new KalturaFilterPager({ pageSize: 25 }),
    order: null,
    responseOptions: this._responseOptions
  };
  
  private _getTotalsActionArgs: ReportGetTotalActionArgs = {
    reportType: KalturaReportType.platformsRealtime,
    reportInputFilter: new KalturaEndUserReportInputFilter({
      toDate: this._getTime(0),
      fromDate: this._getTime(1),
    }),
    responseOptions: this._responseOptions,
  };
  
  private _getTime(hours: number): number {
    return moment().subtract(hours, 'hours').unix();
  }
  
  constructor(private _entryId: string,
              private _startTime: number) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalsActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  public updateDateInterval(): void {
    this._getTableActionArgs.reportInputFilter.toDate = this._getTime(0);
    this._getTableActionArgs.reportInputFilter.fromDate = this._getTime(1);
    this._getTotalsActionArgs.reportInputFilter.toDate = this._getTime(0);
    this._getTotalsActionArgs.reportInputFilter.fromDate = this._getTime(1);
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTotalAction(this._getTotalsActionArgs),
    );
  }
}
