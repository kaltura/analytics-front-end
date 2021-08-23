import { RequestFactory } from '@kaltura-ng/kaltura-common';
import {
  KalturaEndUserReportInputFilter,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaReportInterval,
  KalturaReportResponseOptions,
  KalturaReportType,
  ReportGetGraphsAction,
  ReportGetGraphsActionArgs,
  ReportGetTotalAction,
  ReportGetTotalActionArgs
} from 'kaltura-ngx-client';
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
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    responseOptions: this._responseOptions
  };

  private _getGraphActionArgs: ReportGetGraphsActionArgs = {
    reportType: liveReportTypeMap(KalturaReportType.discoveryRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
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
    this.updateArgs(activationArgs);
  }

  public updateArgs(activationArgs: WidgetsActivationArgs) {
    this._getGraphActionArgs.reportInputFilter.entryIdIn = activationArgs.entryId;
    this._getTotalActionArgs.reportInputFilter.entryIdIn = activationArgs.entryId;

    ['countryIn', 'regionIn', 'citiesIn', 'deviceIn', 'operatingSystemIn', 'browserIn', 'userIds'].forEach(filter => {
      if (activationArgs[filter]) {
        (this._getGraphActionArgs.reportInputFilter as KalturaEndUserReportInputFilter)[filter] = activationArgs[filter];
        (this._getTotalActionArgs.reportInputFilter as KalturaEndUserReportInputFilter)[filter] = activationArgs[filter];
      } else {
        delete this._getGraphActionArgs.reportInputFilter[filter];
        delete this._getTotalActionArgs.reportInputFilter[filter];
      }
    });
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
