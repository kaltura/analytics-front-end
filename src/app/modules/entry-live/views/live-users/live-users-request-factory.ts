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
    ['countryIn', 'regionIn', 'citiesIn', 'deviceIn', 'operatingSystemIn', 'browserIn', 'userIds'].forEach(filter => {
      if (this.activationArgs[filter]) {
        this._getTableActionArgs.reportInputFilter[filter] = this.activationArgs[filter];
      } else {
        delete this._getTableActionArgs.reportInputFilter[filter];
      }
    });
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
