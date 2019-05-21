import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';

export class LiveUsersRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTableActionArgs: ReportGetGraphsActionArgs = {
    reportType: KalturaReportType.usersOverviewRealtime,
    reportInputFilter: new KalturaReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._getTime(30),
      fromDate: this._getTime(200),
      interval: KalturaReportInterval.tenSeconds,
    }),
    responseOptions: this._responseOptions
  };
  
  constructor(private _entryId: string) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  private _getTime(seconds: number): number {
    return moment().subtract(seconds, 'seconds').unix();
  }
  
  
  public updateDateInterval(): void {
    this._getTableActionArgs.reportInputFilter.toDate = this._getTime(30);
    this._getTableActionArgs.reportInputFilter.fromDate = this._getTime(200);
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetGraphsAction(this._getTableActionArgs),
    );
  }
}
