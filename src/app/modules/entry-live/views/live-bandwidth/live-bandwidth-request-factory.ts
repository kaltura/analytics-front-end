import { RequestFactory } from '@kaltura-ng/kaltura-common';
import {KalturaEndUserReportInputFilter, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';
import { getFixedEpoch } from 'shared/utils/get-fixed-epoch';

export class LiveBandwidthRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });

  private _getGraphActionArgs: ReportGetGraphsActionArgs & {reportInputFilter: KalturaEndUserReportInputFilter} = {
    reportType: liveReportTypeMap(KalturaReportType.qosOverviewRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: getFixedEpoch(this._getTime(30)),
      fromDate: this._getTime(200).unix(),
      interval: KalturaReportInterval.tenSeconds,
    }),
    responseOptions: this._responseOptions
  };

  constructor(private _entryId: string, private _countryIn: string, private _regionIn: string, private _citiesIn: string,
              private _deviceIn: string, private _operatingSystemIn: string, private _browserIn: string, private _userIds: string) {
    this._getGraphActionArgs.reportInputFilter.entryIdIn = this._entryId;
    if (this._countryIn) {
      this._getGraphActionArgs.reportInputFilter.countryIn = this._countryIn;
    }
    if (this._regionIn) {
      this._getGraphActionArgs.reportInputFilter.regionIn = this._regionIn;
    }
    if (this._citiesIn) {
      this._getGraphActionArgs.reportInputFilter.citiesIn = this._citiesIn;
    }
    if (this._deviceIn) {
      this._getGraphActionArgs.reportInputFilter.deviceIn = this._deviceIn;
    }
    if (this._operatingSystemIn) {
      this._getGraphActionArgs.reportInputFilter.operatingSystemIn = this._operatingSystemIn;
    }
    if (this._browserIn) {
      this._getGraphActionArgs.reportInputFilter.browserIn = this._browserIn;
    }
    if (this._userIds) {
      this._getGraphActionArgs.reportInputFilter.userIds = this._userIds;
    }
  }

  private _getTime(seconds: number): moment.Moment {
    return moment().subtract(seconds, 'seconds');
  }


  public onPollTickSuccess(): void {
    this._getGraphActionArgs.reportInputFilter.toDate = getFixedEpoch(this._getTime(0));
    this._getGraphActionArgs.reportInputFilter.fromDate = this._getTime(170).unix();
  }

  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetGraphsAction(this._getGraphActionArgs),
    );
  }
}
