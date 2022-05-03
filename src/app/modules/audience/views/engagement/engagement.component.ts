import { Component } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { KalturaEndUserReportInputFilter, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { EngagementExportConfig } from './engagement-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateRanges } from "shared/components/date-filter/date-filter-utils";

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
  public _engagementViewConfig = analyticsConfig.viewsConfig.audience.engagement;
  public _exporting = false;
  public _virtualEventId = '';
  public _miniViewsCount = [
    this._engagementViewConfig.miniHighlights,
    this._engagementViewConfig.miniTopVideos,
    this._engagementViewConfig.miniPeakDay,
  ].filter(Boolean).length;
  public _filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  constructor(private _exportConfigService: EngagementExportConfig) {
    this._exportConfig = _exportConfigService.getConfig(this._engagementViewConfig);
    this._virtualEventId = analyticsConfig.customData && analyticsConfig.customData.eventId ? analyticsConfig.customData.eventId : '';
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

    this._exportConfig = EngagementExportConfig.updateConfig(this._exportConfigService.getConfig(this._engagementViewConfig), 'syndication', update);
  }

  public preExportHandler(): void {
    this._engagementViewConfig.highlights = null; // hide highlights
    this._engagementViewConfig.miniTopVideos = null; // hide miniTopVideos
    this._engagementViewConfig.export = null; // hide csv export
    this._engagementViewConfig.refineFilter = null; // hide refine filter
  }

  public postExportHandler(): void {
    this._engagementViewConfig.highlights = {}; // show highlights
    this._engagementViewConfig.miniTopVideos = {}; // show miniTopVideos
    this._engagementViewConfig.export = {}; // sow csv export
    this._engagementViewConfig.refineFilter = {
      mediaType: {},
      playbackType: {},
      entrySource: {},
      tags: {},
      owners: {},
      categories: {},
      domains: {},
      geo: {}
    }; // show refine filter
  }

  public onExporting(exporting: boolean): void {
    this._exporting = exporting;
  }
}
