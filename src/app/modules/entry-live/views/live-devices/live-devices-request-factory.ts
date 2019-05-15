import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

export class LiveDevicesRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.platforms,
    reportInputFilter: new KalturaEndUserReportInputFilter({
      toDate: this._getServerTime(+new Date()),
      fromDate: this._getServerTime(this._startTime),
    }),
    pager: new KalturaFilterPager({ pageSize: 25 }),
    order: null,
    responseOptions: this._responseOptions
  };
  
  private _getTotalsActionArgs: ReportGetTotalActionArgs = {
    reportType: KalturaReportType.platforms,
    reportInputFilter: new KalturaEndUserReportInputFilter({
      toDate: this._getServerTime(+new Date()),
      fromDate: this._getServerTime(this._startTime),
    }),
    responseOptions: this._responseOptions,
  };
  
  constructor(private _entryId: string,
              private _startTime: number) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalsActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  private _getServerTime(value: number): number {
    return Math.floor(value / 1000);
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTotalAction(this._getTotalsActionArgs),
    );
  }
}
