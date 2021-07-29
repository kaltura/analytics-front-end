import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaMultiRequest, KalturaMultiResponse, KalturaReportInputFilter, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs, ReportGetTotalAction, ReportGetTotalActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { DateRangeServerValue, defaultDateRange, FiltersService } from './filters/filters.service';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';
import { getFixedEpoch } from 'shared/utils/get-fixed-epoch';
import {WidgetsActivationArgs} from "../../widgets/widgets-manager";

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

  constructor(private activationArgs: WidgetsActivationArgs) {
    this._getGraphActionArgs.reportInputFilter.entryIdIn = this.activationArgs.entryId;
    this._getTotalActionArgs.reportInputFilter.entryIdIn = this.activationArgs.entryId;

    if (this.activationArgs.countryIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this.activationArgs.countryIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this.activationArgs.countryIn;
    }
    if (this.activationArgs.regionIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this.activationArgs.regionIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this.activationArgs.regionIn;
    }
    if (this.activationArgs.citiesIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this.activationArgs.citiesIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this.activationArgs.citiesIn;
    }
    if (this.activationArgs.deviceIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this.activationArgs.deviceIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this.activationArgs.deviceIn;
    }
    if (this.activationArgs.operatingSystemIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this.activationArgs.operatingSystemIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this.activationArgs.operatingSystemIn;
    }
    if (this.activationArgs.browserIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this.activationArgs.browserIn;
      this._getTotalActionArgs.reportInputFilter.countryIn = this.activationArgs.browserIn;
    }
    if (this.activationArgs.userIds) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this.activationArgs.userIds;
      this._getTotalActionArgs.reportInputFilter.countryIn = this.activationArgs.userIds;
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
