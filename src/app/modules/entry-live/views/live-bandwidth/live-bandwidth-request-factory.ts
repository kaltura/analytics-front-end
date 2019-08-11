import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

export class LiveBandwidthRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getGraphActionArgs: ReportGetGraphsActionArgs = {
    reportType: reportTypeMap(KalturaReportType.qosOverviewRealtime),
    reportInputFilter: new KalturaReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._getTime(30),
      fromDate: this._getTime(200),
      interval: KalturaReportInterval.tenSeconds,
    }),
    responseOptions: this._responseOptions
  };
  
  constructor(private _entryId: string) {
    this._getGraphActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  private _getTime(seconds: number): number {
    return moment().subtract(seconds, 'seconds').unix();
  }
  
  
  public onPollTickSuccess(): void {
    this._getGraphActionArgs.reportInputFilter.toDate = this._getTime(0);
    this._getGraphActionArgs.reportInputFilter.fromDate = this._getTime(170);
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetGraphsAction(this._getGraphActionArgs),
    );
  }
}
