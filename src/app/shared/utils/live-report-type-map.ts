import { KalturaReportType } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

export function liveReportTypeMap(reportType: KalturaReportType): KalturaReportType {
  if (analyticsConfig.authUsersLiveReports) {
    return mapAuthUsersReport(reportType);
  } else {
    return reportType;
  }
}

function mapAuthUsersReport(reportType: KalturaReportType): KalturaReportType {
  const reportsMap = {
    // TODO add report type mapping
  };
  return reportsMap[reportType] || reportType;
}
