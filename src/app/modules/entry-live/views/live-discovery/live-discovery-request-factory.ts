import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';

export class LiveDiscoveryRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });

  private _getGraphActionArgs: ReportGetGraphsActionArgs = {
    reportType: KalturaReportType.discoveryRealtime,
    reportInputFilter: new KalturaReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._getTime(30),
      fromDate: this._getTime(200),
      interval: KalturaReportInterval.tenSeconds,
    }),
    responseOptions: this._responseOptions
  };
  
  private _getTime(seconds: number): number {
    return moment().subtract(seconds, 'seconds').unix();
  }
  
  constructor(private _entryId: string) {
    this._getGraphActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  public updateDateInterval(): void {
    this._getGraphActionArgs.reportInputFilter.toDate = this._getTime(30);
    this._getGraphActionArgs.reportInputFilter.fromDate = this._getTime(200);
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetGraphsAction(this._getGraphActionArgs),
    );
  }
}
