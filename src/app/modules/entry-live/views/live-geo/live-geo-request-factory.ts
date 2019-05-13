import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetTableAction, ReportGetTableActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

export class LiveGeoRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.mapOverlayCountry,
    reportInputFilter: new KalturaReportInputFilter(),
    pager: new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize }),
    order: '-count_plays',
    responseOptions: this._responseOptions
  };

  private _getTotalsActionArgs: ReportGetTotalActionArgs = {
    reportType: KalturaReportType.mapOverlayCountry,
    reportInputFilter: new KalturaReportInputFilter(),
    responseOptions: this._responseOptions,
  };
  
  public set reportType(value: KalturaReportType) {
    this._getTableActionArgs.reportType = this._getTotalsActionArgs.reportType = value;
  }

  constructor(private _entryId: string) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalsActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTotalAction(this._getTotalsActionArgs),
    );
  }
}
