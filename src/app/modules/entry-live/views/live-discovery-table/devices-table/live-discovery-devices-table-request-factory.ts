import { RequestFactory } from '@kaltura-ng/kaltura-common';
import {
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaReportInterval,
  KalturaReportResponseOptions,
  KalturaReportType,
  ReportGetTableAction,
  ReportGetTableActionArgs,
  ReportGetTotalAction,
  ReportGetTotalActionArgs
} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { DateRangeServerValue, defaultDateRange, FiltersService } from '../../live-discovery-chart/filters/filters.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';
import { getFixedEpoch } from 'shared/utils/get-fixed-epoch';

export class LiveDiscoveryDevicesTableRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
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
    reportType: liveReportTypeMap(KalturaReportType.platformsDiscoveryRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    responseOptions: this._responseOptions
  };

  private _getTableActionArgs: ReportGetTableActionArgs = {
    reportType: liveReportTypeMap(KalturaReportType.platformsDiscoveryRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    pager: new KalturaFilterPager(),
    responseOptions: this._responseOptions
  };

  public set dateRange(range: DateRangeServerValue) {
    if (range.hasOwnProperty('toDate') && range.hasOwnProperty('fromDate')) {
      this._dateRange = range;
      this.onPollTickSuccess();
    }
  }

  constructor(private _entryId: string) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this._entryId;
    this._getTotalActionArgs.reportInputFilter.entryIdIn = this._entryId;
  }

  public set pollFilter(filter: {key: string, value: string | undefined}) {
    if (filter.value) {
      this._getTableActionArgs.reportInputFilter[filter.key] = filter.value;
      this._getTotalActionArgs.reportInputFilter[filter.key] = filter.value;
    } else {
      delete this._getTableActionArgs.reportInputFilter[filter.key];
      delete this._getTotalActionArgs.reportInputFilter[filter.key];
    }
  }

  public set interval(interval: KalturaReportInterval) {
    if (KalturaReportInterval[interval] !== null) {
      this._interval = interval;
      this._getTableActionArgs.reportInputFilter.interval = interval;
      this._getTotalActionArgs.reportInputFilter.interval = interval;
    }
  }

  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTableActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;

    this._getTotalActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTotalActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
  }

  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
      new ReportGetTotalAction(this._getTotalActionArgs),
    );
  }
}
