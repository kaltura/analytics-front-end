import {KalturaReportInterval} from "kaltura-ngx-client";

export interface OverviewDateRange {
  label: string;
  postfix?: string;
  startDate: number;
  endDate: number;
  key: string;
  isSpecific: boolean;
  interval: KalturaReportInterval;
}
