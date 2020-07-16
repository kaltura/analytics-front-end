import { Component } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { KalturaEndUserReportInputFilter, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TopContributorsExportConfig } from './top-contributors-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateRanges } from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-top-contributors',
  templateUrl: './top-contributors.component.html',
  styleUrls: ['./top-contributors.component.scss'],
  providers: [
    TopContributorsExportConfig,
    KalturaLogger.createLogger('TopContributorsComponent'),
  ]

})
export class TopContributorsComponent {
  public _contributorsViewConfig = analyticsConfig.viewsConfig.contributors;
  public _miniViewsCount = [
    this._contributorsViewConfig.miniHighlights,
    this._contributorsViewConfig.miniTopContributors,
    this._contributorsViewConfig.miniTopSources,
  ].filter(Boolean).length;
  public _miniViewsWidth = this._miniViewsCount === 3 ? '33%' : this._miniViewsCount === 2 ? '50%' : '100%';
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

  constructor(private _exportConfigService: TopContributorsExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }
}
