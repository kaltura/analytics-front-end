import { Component } from '@angular/core';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { KalturaEndUserReportInputFilter, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { EngagementExportConfig } from './engagement-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-engagement',
  templateUrl: './engagement.component.html',
  styleUrls: ['./engagement.component.scss'],
  providers: [
    EngagementExportConfig,
    KalturaLogger.createLogger('EngagementComponent')
  ]
})
export class EngagementComponent {
  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _totalCount: number;
  public _reportType: KalturaReportType = reportTypeMap(KalturaReportType.userUsage);
  public _selectedMetrics: string;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _exportConfig: ExportItem[] = [];
  public _filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  
  constructor(private _exportConfigService: EngagementExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }
  
  
  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }
  
  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }
  
  public _onDrillDown(event: string): void {
    let update: Partial<ExportItem> = {};
    if (event) {
      update.objectIds = event;
    }

    this._exportConfig = EngagementExportConfig.updateConfig(this._exportConfigService.getConfig(), 'syndication', update);
  }
}
