import { Component, OnInit } from '@angular/core';
import {DateChangeEvent, DateRanges} from 'shared/components/date-filter/date-filter.service';
import {KalturaEndUserReportInputFilter, KalturaReportType} from 'kaltura-ngx-client';

@Component({
  selector: 'app-engagement',
  templateUrl: './engagement.component.html',
  styleUrls: ['./engagement.component.scss']
})
export class EngagementComponent implements OnInit {

  public _dateRange = DateRanges.CurrentYear;
  public _csvExportHeaders = '';
  public _totalCount: number;
  public reportType: KalturaReportType = KalturaReportType.userUsage;
  public compareFilter: KalturaEndUserReportInputFilter = null;
  public _selectedMetrics: string;
  public filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  constructor() { }

  ngOnInit() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {

  }

}
