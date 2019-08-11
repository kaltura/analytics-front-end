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
  // TODO: add mapping for multi account reports
  return reportType; // temp until map implementation
}
