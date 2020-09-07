import { Component } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { KalturaEndUserReportInputFilter, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { ContentInteractionsExportConfig } from './content-interactions-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateRanges } from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-content-interactions',
  templateUrl: './content-interactions.component.html',
  styleUrls: ['./content-interactions.component.scss'],
  providers: [
    ContentInteractionsExportConfig,
    KalturaLogger.createLogger('ContentInteractionsComponent'),
  ]
})
export class ContentInteractionsComponent {
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
  public _contentInteractionsViewConfig = analyticsConfig.viewsConfig.audience.contentInteractions;
  public _miniViewsCount = [
    this._contentInteractionsViewConfig.miniInteractions,
    this._contentInteractionsViewConfig.miniTopShared,
    this._contentInteractionsViewConfig.topPlaybackSpeed,
    this._contentInteractionsViewConfig.topStats,
  ].filter(Boolean).length;
  public _carouselItemsCount = [
    this._contentInteractionsViewConfig.topPlaybackSpeed,
    this._contentInteractionsViewConfig.topStats,
  ].filter(Boolean).length;
  public _filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  constructor(private _exportConfigService: ContentInteractionsExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }
}
