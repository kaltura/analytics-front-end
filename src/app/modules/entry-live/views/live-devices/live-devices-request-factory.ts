import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { DateRangeServerValue, defaultDateRange, FiltersService } from '../live-discovery-chart/filters/filters.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';
import { getFixedEpoch } from 'shared/utils/get-fixed-epoch';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';

export class LiveDevicesRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });

  private _interval = KalturaReportInterval.tenSeconds;

  private _dateRange: DateRangeServerValue = {
    toDate: getFixedEpoch(moment()),
    fromDate: FiltersService.getDateRangeServerValue(defaultDateRange).fromDate,
  };

  private _getTableActionArgs: ReportGetTableActionArgs & {reportInputFilter: KalturaEndUserReportInputFilter} = {
    reportType: liveReportTypeMap(KalturaReportType.platformsRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    pager: new KalturaFilterPager({ pageSize: 25 }),
    order: null,
    responseOptions: this._responseOptions
  };

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
    }
  }

  constructor(private activationArgs: WidgetsActivationArgs) {
    this.updateArgs(activationArgs);
  }

  public updateArgs(activationArgs: WidgetsActivationArgs) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = activationArgs.entryId;
    ['countryIn', 'regionIn', 'citiesIn', 'deviceIn', 'operatingSystemIn', 'browserIn', 'userIds'].forEach(filter => {
      if (activationArgs[filter]) {
        this._getTableActionArgs.reportInputFilter[filter] = activationArgs[filter];
      } else {
        delete this._getTableActionArgs.reportInputFilter[filter];
      }
    });
  }

  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = this._dateRange.toDate;
    this._getTableActionArgs.reportInputFilter.fromDate = this._dateRange.fromDate;
  }

  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetTableAction(this._getTableActionArgs),
    );
  }
}
