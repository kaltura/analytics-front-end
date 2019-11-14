import { KalturaReportType } from 'kaltura-ngx-client';
import { analyticsConfig, EntryLiveUsersMode } from 'configuration/analytics-config';

export function liveReportTypeMap(reportType: KalturaReportType): KalturaReportType {
  if (analyticsConfig.liveEntryUsersReports === EntryLiveUsersMode.All) {
    return mapAuthUsersReport(reportType);
  } else {
    return reportType;
  }
}

function mapAuthUsersReport(reportType: KalturaReportType): KalturaReportType {
  const reportsMap = {
    [KalturaReportType.discoveryRealtime]:             KalturaReportType.discoveryViewRealtime,
  };
  return reportsMap[reportType] || reportType;
}
