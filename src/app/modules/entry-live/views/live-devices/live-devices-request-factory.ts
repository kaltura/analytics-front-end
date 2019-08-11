import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

export class LiveDevicesRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: reportTypeMap(KalturaReportType.platformsRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      toDate: moment().unix(),
      fromDate: this._getFromDate(),
    }),
    pager: new KalturaFilterPager({ pageSize: 25 }),
    order: null,
    responseOptions: this._responseOptions
  };
  
  private _getFromDate(): number {
    return moment().subtract(3, 'hours').unix();
  }
  
  constructor(private _entryId: string) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = moment().unix();
    this._getTableActionArgs.reportInputFilter.fromDate = this._getFromDate();
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
    );
  }
}
