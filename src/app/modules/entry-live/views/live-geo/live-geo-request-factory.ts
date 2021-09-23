import { RequestFactory } from '@kaltura-ng/kaltura-common';
import {KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetTableAction, ReportGetTableActionArgs} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { DateRangeServerValue, defaultDateRange, FiltersService } from '../live-discovery-chart/filters/filters.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';
import { getFixedEpoch } from 'shared/utils/get-fixed-epoch';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';

export class LiveGeoRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private appliedFilter = {
    countryIn: null,
    regionIn: null,
    citiesIn: null,
  };
  constructor(private activationArgs: WidgetsActivationArgs, _isAuthUsers: boolean = false) {
    this.updateArgs(activationArgs, _isAuthUsers);
  }

  public updateArgs(activationArgs: WidgetsActivationArgs, _isAuthUsers: boolean = false) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = activationArgs.entryId;
    ['countryIn', 'regionIn', 'citiesIn', 'deviceIn', 'operatingSystemFamilyIn', 'browserFamilyIn', 'userIds'].forEach(filter => {
      if (activationArgs[filter]) {
        this._getTableActionArgs.reportInputFilter[filter] = activationArgs[filter];
      } else {
        delete this._getTableActionArgs.reportInputFilter[filter];
      }
    });
    this.appliedFilter = {
      countryIn: activationArgs.countryIn || null,
      regionIn: activationArgs.regionIn || null,
      citiesIn: activationArgs.citiesIn || null,
    };
    this._getTableActionArgs.order = _isAuthUsers ? '-view_unique_audience' : '-views';
  }

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
    reportType: liveReportTypeMap(KalturaReportType.mapOverlayCountryRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      toDate: this._dateRange.toDate,
      fromDate: this._dateRange.fromDate,
      interval: this._interval,
    }),
    pager: new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize }),
    order: '-views',
    responseOptions: this._responseOptions
  };

  public set reportType(value: KalturaReportType) {
    this._getTableActionArgs.reportType = value;
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
    }
  }

  public set drillDown(value: string[]) {
    this.reportType = value.length === 2 ? liveReportTypeMap(KalturaReportType.mapOverlayCityRealtime) : value.length === 1 ? liveReportTypeMap(KalturaReportType.mapOverlayRegionRealtime) : liveReportTypeMap(KalturaReportType.mapOverlayCountryRealtime);
    if (value.length === 1) {
      this._getTableActionArgs.reportInputFilter.countryIn = value[0];
      delete this._getTableActionArgs.reportInputFilter.regionIn;
    } else if (value.length > 1) {
      this._getTableActionArgs.reportInputFilter.countryIn = value[0];
      this._getTableActionArgs.reportInputFilter.regionIn = value[1];
    } else {
      delete this._getTableActionArgs.reportInputFilter.countryIn;
      delete this._getTableActionArgs.reportInputFilter.regionIn;
    }
    if (this.appliedFilter.countryIn) {
      this._getTableActionArgs.reportInputFilter.countryIn = this.appliedFilter.countryIn;
    }
    if (this.appliedFilter.regionIn) {
      this._getTableActionArgs.reportInputFilter.regionIn = this.appliedFilter.regionIn;
    }
    if (this.appliedFilter.citiesIn) {
      this._getTableActionArgs.reportInputFilter.citiesIn = this.appliedFilter.citiesIn;
    }
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
