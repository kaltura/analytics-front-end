import { KalturaReportType } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

export function reportTypeMap(reportType: KalturaReportType): KalturaReportType {
  if (analyticsConfig.customData && analyticsConfig.customData.globalReports && analyticsConfig.customData.globalReports === true) {
    return mapGlobalReports(reportType);
  } else  if (analyticsConfig.multiAccount) {
    return mapMultiAccount(reportType);
  } else {
    return reportType;
  }
}
function mapGlobalReports(reportType: KalturaReportType): KalturaReportType {
  console.log("---> looking for global report...");
  const reportsMap = {};
  return reportsMap[reportType] || reportType;
}

function mapMultiAccount(reportType: KalturaReportType): KalturaReportType {
  const reportsMap = {
    [KalturaReportType.contentDropoff]:             KalturaReportType.contentDropoffVpaas,
    [KalturaReportType.topSyndication]:             KalturaReportType.topSyndicationVpaas,
    [KalturaReportType.userTopContent]:             KalturaReportType.userTopContentVpaas,
    [KalturaReportType.userUsage]:                  KalturaReportType.userUsageVpaas,
    [KalturaReportType.platforms]:                  KalturaReportType.platformsVpaas,
    [KalturaReportType.operatingSystem]:            KalturaReportType.operatingSystemVpaas,
    [KalturaReportType.browsers]:                   KalturaReportType.browsersVpaas,
    [KalturaReportType.mapOverlayCity]:             KalturaReportType.mapOverlayCityVpaas,
    [KalturaReportType.operatingSystemFamilies]:    KalturaReportType.operatingSystemFamiliesVpaas,
    [KalturaReportType.browsersFamilies]:           KalturaReportType.browsersFamiliesVpaas,
    [KalturaReportType.userEngagementTimeline]:     KalturaReportType.userEngagementTimelineVpaas,
    [KalturaReportType.uniqueUsersPlay]:            KalturaReportType.uniqueUsersPlayVpaas,
    [KalturaReportType.mapOverlayCountry]:          KalturaReportType.mapOverlayCountryVpaas,
    [KalturaReportType.mapOverlayRegion]:           KalturaReportType.mapOverlayRegionVpaas,
    [KalturaReportType.topContentCreator]:          KalturaReportType.topContentCreatorVpaas,
    [KalturaReportType.topContentContributors]:     KalturaReportType.topContentContributorsVpaas,
    [KalturaReportType.topSources]:                 KalturaReportType.topSourcesVpaas,
    [KalturaReportType.contentReportReasons]:       KalturaReportType.contentReportReasonsVpaas,
    [KalturaReportType.playerRelatedInteractions]:  KalturaReportType.playerRelatedInteractionsVpaas,
    [KalturaReportType.playbackRate]:               KalturaReportType.playbackRateVpaas,
    [KalturaReportType.partnerUsage]:               KalturaReportType.partnerUsageVpaas,
    [KalturaReportType.topPlaybackContext]:         KalturaReportType.topPlaybackContextVpaas,
  };
  return reportsMap[reportType] || reportType;
}
