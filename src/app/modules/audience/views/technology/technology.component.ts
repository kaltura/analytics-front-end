import { Component, OnInit, ViewChild } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { TechDevicesOverviewComponent } from './devices-overview/devices-overview.component';
import { KalturaReportType } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TechnologyExportConfig } from './technology-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { EngagementExportConfig } from '../engagement/engagement-export.config';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateRanges } from "shared/components/date-filter/date-filter-utils";
import {RefineFilter} from "shared/components/filter/filter.component";

@Component({
  selector: 'app-technology',
  templateUrl: './technology.component.html',
  styleUrls: ['./technology.component.scss'],
  providers: [
    TechnologyExportConfig,
    KalturaLogger.createLogger('TechnologyComponent')
  ]
})
export class TechnologyComponent implements OnInit {
  @ViewChild('overview') _overview: TechDevicesOverviewComponent;

  public _selectedMetric: string;
  public _dateRange = DateRanges.Last30D;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = false;
  public _allowedDevices = ['Computer', 'Mobile', 'Tablet', 'Game console', 'Digital media receiver'];
  public _filterEvent: DateChangeEvent = null;
  public _devicesFilter: string[] = [];
  public _devicesList: { value: string, label: string; }[] = [];
  public _reportType = reportTypeMap(KalturaReportType.platforms);
  public _exportConfig: ExportItem[] = [];
  public _technologyViewConfig = analyticsConfig.viewsConfig.audience.technology;
  public _refineFilterOpened = false;
  public _selectedRefineFilters: RefineFilter = [{
    type: "playbackType",
    value: 'vod'
  }];
  public _refineFilter: RefineFilter = [];

  constructor(private _exportConfigService: TechnologyExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }

  ngOnInit() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._filterEvent = event;
  }

  public _onDeviceFilterChange(event: string[]): void {
    this._devicesFilter = event;
  }

  public _onDevicesListChange(event: { value: string, label: string; }[]): void {
    this._devicesList = event;
  }

  public _onReportDeviceFilterChange(): void {
    if (this._overview) {
      this._overview.resetDeviceFilters();
    }
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

  public _onDrillDown(event: { drillDown: string, reportType: KalturaReportType, name: string }): void {
    const { drillDown, reportType, name } = event;
    let update: Partial<ExportItem> = { reportType: reportType };

    if (reportType === reportTypeMap(KalturaReportType.browsers)) {
      update.additionalFilters = { browserFamilyIn: drillDown };
    } else if (reportType === reportTypeMap(KalturaReportType.operatingSystem)) {
      update.additionalFilters = { operatingSystemFamilyIn: drillDown };
    }
    this._exportConfig = EngagementExportConfig.updateConfig(this._exportConfigService.getConfig(), name, update);
  }
}
