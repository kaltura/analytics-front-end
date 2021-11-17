import {KalturaReportInterval} from "kaltura-ngx-client";

export interface OverviewDateRange {
  label: string;
  startDate: number;
  endDate: number;
  key: string;
  isSpecific: boolean;
  interval: KalturaReportInterval;
}
