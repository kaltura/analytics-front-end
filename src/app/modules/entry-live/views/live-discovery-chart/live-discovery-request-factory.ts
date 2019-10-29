import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { DateRangeServerValue, defaultDateRange, FiltersService } from './filters/filters.service';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';

export class LiveDiscoveryRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _dateRange: DateRangeServerValue = {
    toDate: moment().unix(),
    fromDate: FiltersService.getDateRangeServerValue(defaultDateRange).fromDate,
  };
  
  private _interval = KalturaReportInterval.tenSeconds;
  
  private _getTotalActionArgs: ReportGetTotalActionArgs = {
    reportType: liveReportTypeMap(KalturaReportType.discoveryRealtime),
    reportInputFilter: new KalturaReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    responseOptions: this._responseOptions
  };

  private _getGraphActionArgs: ReportGetGraphsActionArgs = {
    reportType: liveReportTypeMap(KalturaReportType.discoveryRealtime),
    reportInputFilter: new KalturaReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    responseOptions: this._responseOptions
  };
  
  public set dateRange(range: DateRangeServerValue) {
    if (range.hasOwnProperty('toDate') && range.hasOwnProperty('fromDate')) {
      this._dateRange = range;
      this.onPollTickSuccess();
    }
  }
  
  constructor(private _entryId: string) {
    this._getGraphActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }

  private _getTime(seconds: number): number {
    return moment().subtract(seconds, 'seconds').unix();
  }
  
  public set interval(interval: KalturaReportInterval) {
    if (KalturaReportInterval[interval] !== null) {
      this._interval = interval;
      this._getGraphActionArgs.reportInputFilter.interval = interval;
      this._getTotalActionArgs.reportInputFilter.interval = interval;
    }
  }
  
  public onPollTickSuccess(): void {
    this._getGraphActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getGraphActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
    
    this._getTotalActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTotalActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetGraphsAction(this._getGraphActionArgs),
      new ReportGetTotalAction(this._getTotalActionArgs),
    );
  }
}
