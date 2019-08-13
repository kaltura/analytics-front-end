import { KalturaReportType } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

export function reportTypeMap(reportType: KalturaReportType): KalturaReportType {
  if (analyticsConfig.multiAccount) {
    return mapMultiAccount(reportType);
  } else {
    return reportType;
  }
}

function mapMultiAccount(reportType: KalturaReportType): KalturaReportType {
  const reportsMap = {
    "2": KalturaReportType.contentDropoffVpaas,
    "6": KalturaReportType.topSyndicationVpaas,
    "13": KalturaReportType.userTopContentVpaas,
    "17": KalturaReportType.userUsageVpaas,
    "21": KalturaReportType.platformsVpaas,
    "22": KalturaReportType.operatingSystemVpaas,
    "23": KalturaReportType.browsersVpaas,
    "30": KalturaReportType.mapOverlayCityVpaas,
    "32": KalturaReportType.operatingSystemFamiliesVpaas,
    "33": KalturaReportType.browsersFamiliesVpaas,
    "34": KalturaReportType.userEngagementTimelineVpaas,
    "35": KalturaReportType.uniqueUsersPlayVpaas,
    "36": KalturaReportType.mapOverlayCountryVpaas,
    "37": KalturaReportType.mapOverlayRegionVpaas,
    "38": KalturaReportType.topContentCreatorVpaas,
    "39": KalturaReportType.topContentContributorsVpaas,
    "41": KalturaReportType.topSourcesVpaas,
    "44": KalturaReportType.contentReportReasonsVpaas,
    "45": KalturaReportType.playerRelatedInteractionsVpaas,
    "46": KalturaReportType.playbackRateVpaas,
    "201": KalturaReportType.partnerUsageVpaas
  };
  console.log("---> calling report type: " + reportsMap[reportType]);
  return reportsMap[reportType] || reportType;
}
