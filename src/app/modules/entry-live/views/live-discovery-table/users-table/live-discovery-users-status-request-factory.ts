import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { DateRangeServerValue } from '../../live-discovery-chart/filters/filters.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';

export class LiveDiscoveryUsersStatusRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _dateRange: DateRangeServerValue = {
    toDate: moment().unix(),
    fromDate: moment().subtract(1, 'minute').unix(),
  };
  
  private _getTotalTableActionArgs: ReportGetTableActionArgs = {
    reportType: liveReportTypeMap(KalturaReportType.playbackTypeRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: KalturaReportInterval.tenSeconds,
    }),
    pager: new KalturaFilterPager(),
    responseOptions: this._responseOptions
  };
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: liveReportTypeMap(KalturaReportType.entryLevelUsersStatusRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: moment().unix(),
      fromDate: this._getFromDate(),
      interval: KalturaReportInterval.tenSeconds,
    }),
    pager: new KalturaFilterPager(),
    responseOptions: this._responseOptions
  };

  constructor(private _entryId: string) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  private _getFromDate(): number {
    return moment().subtract(30, 'seconds').unix();
  }
  
  public set userIds(userIds: string) {
    if (userIds) {
      (<KalturaEndUserReportInputFilter>this._getTableActionArgs.reportInputFilter).userIds = userIds;
      (<KalturaEndUserReportInputFilter>this._getTotalTableActionArgs.reportInputFilter).userIds = userIds;
    } else {
      delete (<KalturaEndUserReportInputFilter>this._getTableActionArgs.reportInputFilter).userIds;
      delete (<KalturaEndUserReportInputFilter>this._getTotalTableActionArgs.reportInputFilter).userIds;
    }
  }
  
  public set dateRange(range: DateRangeServerValue) {
    if (range && range.hasOwnProperty('toDate') && range.hasOwnProperty('fromDate')) {
      this._dateRange = range;
      this.onPollTickSuccess();
    }
  }
  
  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = moment().unix();
    this._getTableActionArgs.reportInputFilter.fromDate = this._getFromDate();
  
    this._getTotalTableActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTotalTableActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTableAction(this._getTotalTableActionArgs),
    );
  }
}
