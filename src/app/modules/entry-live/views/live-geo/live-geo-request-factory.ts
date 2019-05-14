import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

export class LiveGeoRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse> {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.mapOverlayCountry,
    reportInputFilter: new KalturaReportInputFilter({
      toDate: this._getServerTime(+new Date()),
      fromDate: this._getServerTime(this._startTime),
    }),
    pager: new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize }),
    order: '-count_plays',
    responseOptions: this._responseOptions
  };

  private _getTotalsActionArgs: ReportGetTotalActionArgs = {
    reportType: KalturaReportType.mapOverlayCountry,
    reportInputFilter: new KalturaReportInputFilter({
      toDate: this._getServerTime(+new Date()),
      fromDate: this._getServerTime(this._startTime),
    }),
    responseOptions: this._responseOptions,
  };
  
  public set timeRange(value: { from?: number, to?: number }) {
    if (value) {
      const { from, to } = value;
      
      if (from) {
        this._getTableActionArgs.reportInputFilter.fromDate = this._getServerTime(from);
        this._getTotalsActionArgs.reportInputFilter.fromDate = this._getServerTime(from);
      }
  
      if (to) {
        this._getTableActionArgs.reportInputFilter.toDate = this._getServerTime(to);
        this._getTotalsActionArgs.reportInputFilter.toDate = this._getServerTime(to);
      }
    }
  }
  
  public set reportType(value: KalturaReportType) {
    this._getTableActionArgs.reportType = this._getTotalsActionArgs.reportType = value;
  }
  
  public set drillDown(value: string[]) {
    this.reportType = value.length === 2 ? KalturaReportType.mapOverlayCity : value.length === 1 ? KalturaReportType.mapOverlayRegion : KalturaReportType.mapOverlayCountry;
    if (value.length > 0) {
      this._getTableActionArgs.reportInputFilter.countryIn = value[0];
      this._getTotalsActionArgs.reportInputFilter.countryIn = value[0];
    } else  if (value.length > 1) {
      this._getTableActionArgs.reportInputFilter.regionIn = value[1];
      this._getTotalsActionArgs.reportInputFilter.regionIn = value[1];
    } else {
      delete this._getTableActionArgs.reportInputFilter.regionIn;
      delete this._getTotalsActionArgs.reportInputFilter.regionIn;
    }
  }

  constructor(private _entryId: string,
              private _startTime: number) {
    // this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
    // this._getTotalsActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  private _getServerTime(value: number): number {
    return Math.floor(value / 1000);
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTotalAction(this._getTotalsActionArgs),
    );
  }
}
