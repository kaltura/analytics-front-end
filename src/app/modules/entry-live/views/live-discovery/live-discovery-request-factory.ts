import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { DateRangeServerValue } from './filters/filters.service';

export class LiveDiscoveryRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private _timeRange: DateRangeServerValue = {
    toDate: moment().unix(),
    fromDate: moment().subtract(1, 'minute').unix(),
  };
  
  private _interval = KalturaReportInterval.tenSeconds;

  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });

  private _getGraphActionArgs: ReportGetGraphsActionArgs = {
    reportType: KalturaReportType.discoveryRealtime,
    reportInputFilter: new KalturaReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._timeRange.toDate,
      fromDate: this._timeRange.fromDate,
      interval: this._interval,
    }),
    responseOptions: this._responseOptions
  };
  
  private _getTime(seconds: number): number {
    return moment().subtract(seconds, 'seconds').unix();
  }
  
  public set interval(interval: KalturaReportInterval) {
    if (KalturaReportInterval[interval] !== null) {
      this._interval = interval;
      this._getGraphActionArgs.reportInputFilter.interval = interval;
    }
  }
  
  public set timeRange(range: DateRangeServerValue) {
    if (range.hasOwnProperty('toDate') && range.hasOwnProperty('fromDate')) {
      this._timeRange = range;
      this.updateDateInterval();
    }
  }
  
  constructor(private _entryId: string) {
    this._getGraphActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  public updateDateInterval(): void {
    this._getGraphActionArgs.reportInputFilter.toDate = this._timeRange.toDate;
    this._getGraphActionArgs.reportInputFilter.fromDate = this._timeRange.fromDate;
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetGraphsAction(this._getGraphActionArgs),
    );
  }
}
