import { RequestFactory } from '@kaltura-ng/kaltura-common';
import {
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaReportInputFilter,
  KalturaReportInterval,
  KalturaReportResponseOptions,
  KalturaReportType,
  ReportGetTableAction,
  ReportGetTableActionArgs,
  ReportGetTotalAction,
  ReportGetTotalActionArgs
} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { DateRangeServerValue } from '../../live-discovery-chart/filters/filters.service';

export class LiveDiscoveryUsersTableRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _dateRange: DateRangeServerValue = {
    toDate: moment().unix(),
    fromDate: moment().subtract(1, 'minute').unix(),
  };
  
  private _interval = KalturaReportInterval.tenSeconds;
  
  private _getTotalActionArgs: ReportGetTotalActionArgs = {
    reportType: KalturaReportType.entryLevelUsersDiscoveryRealtime,
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    responseOptions: this._responseOptions
  };
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.entryLevelUsersDiscoveryRealtime,
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    pager: new KalturaFilterPager(),
    responseOptions: this._responseOptions
  };
  
  public set dateRange(range: DateRangeServerValue) {
    if (range.hasOwnProperty('toDate') && range.hasOwnProperty('fromDate')) {
      this._dateRange = range;
      this.onPollTickSuccess();
    }
  }
  
  constructor(private _entryId: string) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  private _getTime(seconds: number): number {
    return moment().subtract(seconds, 'seconds').unix();
  }
  
  public set interval(interval: KalturaReportInterval) {
    if (KalturaReportInterval[interval] !== null) {
      this._interval = interval;
      this._getTableActionArgs.reportInputFilter.interval = interval;
      this._getTotalActionArgs.reportInputFilter.interval = interval;
    }
  }
  
  public set userIds(userIds: string) {
    if (userIds) {
      (<KalturaEndUserReportInputFilter>this._getTableActionArgs.reportInputFilter).userIds = userIds;
      (<KalturaEndUserReportInputFilter>this._getTotalActionArgs.reportInputFilter).userIds = userIds;
    } else {
      delete (<KalturaEndUserReportInputFilter>this._getTableActionArgs.reportInputFilter).userIds;
      delete (<KalturaEndUserReportInputFilter>this._getTotalActionArgs.reportInputFilter).userIds;
    }
    
  }
  
  public set pager(pager: KalturaFilterPager) {
    this._getTableActionArgs.pager = pager;
  }
  
  public set order(order: string) {
    this._getTableActionArgs.order = order;
  }
  
  
  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTableActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
    
    this._getTotalActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTotalActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTotalAction(this._getTotalActionArgs),
    );
  }
}
