import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { DateRangeServerValue, defaultDateRange, FiltersService } from './filters/filters.service';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';
import { getFixedEpoch } from 'shared/utils/get-fixed-epoch';

export class LiveDiscoveryRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });

  private _dateRange: DateRangeServerValue = {
    toDate: getFixedEpoch(moment()),
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

  constructor(private _entryId: string, private _countryIn: string, private _regionIn: string, private _citiesIn: string,
              private _deviceIn: string, private _operatingSystemIn: string, private _browserIn: string, private _userIds: string) {
    this._getGraphActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalActionArgs.reportInputFilter.entryIdIn = this._entryId;

    if (this._countryIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this._countryIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this._countryIn;
    }
    if (this._regionIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this._regionIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this._regionIn;
    }
    if (this._citiesIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this._citiesIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this._citiesIn;
    }
    if (this._deviceIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this._deviceIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this._deviceIn;
    }
    if (this._operatingSystemIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this._operatingSystemIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this._operatingSystemIn;
    }
    if (this._browserIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this._browserIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this._browserIn;
    }
    if (this._userIds) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this._userIds;
      this._getTotalActionArgs.reportInputFilter.countryIn = this._userIds;
    }
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
