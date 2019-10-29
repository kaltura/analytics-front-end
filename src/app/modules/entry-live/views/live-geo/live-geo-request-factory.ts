import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { DateRangeServerValue } from '../live-discovery-chart/filters/filters.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';

export class LiveGeoRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });
  
  private _interval = KalturaReportInterval.tenSeconds;
  
  private _dateRange: DateRangeServerValue = {
    toDate: moment().unix(),
    fromDate: moment().subtract(1, 'minute').unix(),
  };
  
  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: liveReportTypeMap(KalturaReportType.mapOverlayCountryRealtime),
    reportInputFilter: new KalturaReportInputFilter({
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    pager: new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize }),
    order: '-count_plays',
    responseOptions: this._responseOptions
  };

  private _getTotalsActionArgs: ReportGetTotalActionArgs = {
    reportType: liveReportTypeMap(KalturaReportType.mapOverlayCountryRealtime),
    reportInputFilter: new KalturaReportInputFilter({
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    responseOptions: this._responseOptions,
  };
  
  public set reportType(value: KalturaReportType) {
    this._getTableActionArgs.reportType = this._getTotalsActionArgs.reportType = value;
  }
  
  public set dateRange(range: DateRangeServerValue) {
    if (range.hasOwnProperty('toDate') && range.hasOwnProperty('fromDate')) {
      this._dateRange = range;
      this.onPollTickSuccess();
    }
  }
  
  public set interval(interval: KalturaReportInterval) {
    if (KalturaReportInterval[interval] !== null) {
      this._interval = interval;
      this._getTableActionArgs.reportInputFilter.interval = interval;
      this._getTotalsActionArgs.reportInputFilter.interval = interval;
    }
  }
  
  public set drillDown(value: string[]) {
    this.reportType = value.length === 2 ? liveReportTypeMap(KalturaReportType.mapOverlayCityRealtime) : value.length === 1 ? liveReportTypeMap(KalturaReportType.mapOverlayRegionRealtime) : liveReportTypeMap(KalturaReportType.mapOverlayCountryRealtime);
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
  
  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTableActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
    this._getTotalsActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTotalsActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
  }
  
  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTotalAction(this._getTotalsActionArgs),
    );
  }
}
