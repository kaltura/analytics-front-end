import { RequestFactory } from '@kaltura-ng/kaltura-common';
import {KalturaEndUserReportInputFilter, KalturaMultiRequest, KalturaMultiResponse, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportType, ReportGetGraphsAction, ReportGetGraphsActionArgs} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { OnPollTickSuccess } from 'shared/services/server-polls-base.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';
import { getFixedEpoch } from 'shared/utils/get-fixed-epoch';
import { WidgetsActivationArgs } from '../../widgets/widgets-manager';

export class LiveUsersRequestFactory implements RequestFactory<KalturaMultiRequest, KalturaMultiResponse>, OnPollTickSuccess {
  private readonly _responseOptions = new KalturaReportResponseOptions({
    delimiter: analyticsConfig.valueSeparator,
    skipEmptyDates: analyticsConfig.skipEmptyBuckets
  });

  private _getTableActionArgs: ReportGetGraphsActionArgs & {reportInputFilter: KalturaEndUserReportInputFilter} = {
    reportType: liveReportTypeMap(KalturaReportType.usersOverviewRealtime),
    reportInputFilter: new KalturaEndUserReportInputFilter({
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      toDate: getFixedEpoch(this._getTime(30)),
      fromDate: this._getTime(200).unix(),
      interval: KalturaReportInterval.tenSeconds,
    }),
    responseOptions: this._responseOptions
  };

  constructor(private activationArgs: WidgetsActivationArgs) {
    this._getTableActionArgs.reportInputFilter.entryIdIn = this.activationArgs.entryId;
    if (this.activationArgs.countryIn) {
      this._getTableActionArgs.reportInputFilter.countryIn = this.activationArgs.countryIn;
    }
    if (this.activationArgs.regionIn) {
      this._getTableActionArgs.reportInputFilter.regionIn = this.activationArgs.regionIn;
    }
    if (this.activationArgs.citiesIn) {
      this._getTableActionArgs.reportInputFilter.citiesIn = this.activationArgs.citiesIn;
    }
    if (this.activationArgs.deviceIn) {
      this._getTableActionArgs.reportInputFilter.deviceIn = this.activationArgs.deviceIn;
    }
    if (this.activationArgs.operatingSystemIn) {
      this._getTableActionArgs.reportInputFilter.operatingSystemIn = this.activationArgs.operatingSystemIn;
    }
    if (this.activationArgs.browserIn) {
      this._getTableActionArgs.reportInputFilter.browserIn = this.activationArgs.browserIn;
    }
    if (this.activationArgs.userIds) {
      this._getTableActionArgs.reportInputFilter.userIds = this.activationArgs.userIds;
    }
  }

  private _getTime(seconds: number): moment.Moment {
    return moment().subtract(seconds, 'seconds');
  }


  public onPollTickSuccess(): void {
    this._getTableActionArgs.reportInputFilter.toDate = getFixedEpoch(this._getTime(0));
    this._getTableActionArgs.reportInputFilter.fromDate = this._getTime(170).unix();
  }

  public create(): KalturaMultiRequest {
    return new KalturaMultiRequest(
      new ReportGetGraphsAction(this._getTableActionArgs),
    );
  }
}
