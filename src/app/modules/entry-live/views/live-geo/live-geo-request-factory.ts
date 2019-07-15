import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';

export class LiveGeoRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: KalturaReportType.mapOverlayCountryRealtime,
    reportInputFilter: new KalturaReportInputFilter({
      toDate: moment().unix(),
      fromDate: this._getFromDate(),
    }),
    pager: new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize }),
    order: '-count_plays',
    responseOptions: this._responseOptions
  };

  private _getTotalsActionArgs: ReportGetTotalActionArgs = {
    reportType: KalturaReportType.mapOverlayCountryRealtime,
    reportInputFilter: new KalturaReportInputFilter({
      toDate: moment().unix(),
      fromDate: this._getFromDate(),
    }),
    responseOptions: this._responseOptions,
  };
  
  public set reportType(value: KalturaReportType) {
    this._getTableActionArgs.reportType = this._getTotalsActionArgs.reportType = value;
  }
  
  public set drillDown(value: string[]) {
    this.reportType = value.length === 2 ? KalturaReportType.mapOverlayCityRealtime : value.length === 1 ? KalturaReportType.mapOverlayRegionRealtime : KalturaReportType.mapOverlayCountryRealtime;
    if (value.length === 1) {
      this._getTableActionArgs.reportInputFilter.countryIn = value[0];
      this._getTotalsActionArgs.reportInputFilter.countryIn = value[0];
      delete this._getTableActionArgs.reportInputFilter.regionIn;
      delete this._getTotalsActionArgs.reportInputFilter.regionIn;
    } else if (value.length > 1) {
      this._getTableActionArgs.reportInputFilter.countryIn = value[0];
      this._getTotalsActionArgs.reportInputFilter.countryIn = value[0];
      this._getTableActionArgs.reportInputFilter.regionIn = value[1];
      this._getTotalsActionArgs.reportInputFilter.regionIn = value[1];
    } else {
      delete this._getTableActionArgs.reportInputFilter.countryIn;
      delete this._getTotalsActionArgs.reportInputFilter.countryIn;
      delete this._getTableActionArgs.reportInputFilter.regionIn;
      delete this._getTotalsActionArgs.reportInputFilter.regionIn;
    }
  }

  constructor(private _entryId: string) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalsActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }
  
  private _getFromDate(): number {
    return moment().subtract(3, 'hours').unix();
  }
  
  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = moment().unix();
    this._getTableActionArgs.reportInputFilter.fromDate = this._getFromDate();
    this._getTotalsActionArgs.reportInputFilter.toDate = moment().unix();
    this._getTotalsActionArgs.reportInputFilter.fromDate = this._getFromDate();
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTotalAction(this._getTotalsActionArgs),
    );
  }
}
