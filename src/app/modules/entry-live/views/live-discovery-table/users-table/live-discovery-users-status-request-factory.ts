import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';

export class LiveDiscoveryUsersStatusRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTotalTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.playbackTypeRealtime,
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: moment().unix(),
      fromDate: this._getFromDate(),
      interval: KalturaReportInterval.tenSeconds,
    }),
    pager: new KalturaFilterPager(),
    responseOptions: this._responseOptions
  };
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.entryLevelUsersStatusRealtime,
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
    return moment().subtract(10, 'seconds').unix();
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
  
  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = moment().unix();
    this._getTableActionArgs.reportInputFilter.fromDate = this._getFromDate();
  
    this._getTotalTableActionArgs.reportInputFilter.toDate = moment().unix();
    this._getTotalTableActionArgs.reportInputFilter.fromDate = this._getFromDate();
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTableAction(this._getTotalTableActionArgs),
    );
  }
}
