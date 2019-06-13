import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';

export class EntriesLiveRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.topContentCreator,
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: moment().unix(),
      fromDate: this._getFromTime(),
    }),
    pager: new KalturaFilterPager({ pageSize: 25, pageIndex: 1 }),
    order: '-entry_name',
    responseOptions: this._responseOptions
  };
  
  private _getFromTime(): number {
    return moment().subtract(7, 'days').unix();
  }
  
  public set pager(pager: KalturaFilterPager) {
    this._getTableActionArgs.pager = pager;
  }
  
  public set order(order: string) {
    this._getTableActionArgs.order = order;
  }
  
  
  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = moment().unix();
    this._getTableActionArgs.reportInputFilter.fromDate = this._getFromTime();
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
    );
  }
}
