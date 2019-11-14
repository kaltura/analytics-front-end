import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { KalturaMediaEntry, KalturaMediaType, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import * as moment from 'moment';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { ErrorsManagerService } from 'shared/services';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { EntryExportConfig } from './entry-export.config';
import { ViewConfig, viewsConfig } from 'configuration/view-config';
import { isEmptyObject } from 'shared/utils/is-empty-object';

@Component({
  selector: 'app-video-entry',
  templateUrl: './entry-view.component.html',
  styleUrls: ['./entry-view.component.scss'],
  providers: [
    EntryExportConfig,
  ]
})
export class VideoEntryViewComponent implements OnDestroy {
  @Input() isChildAccount: boolean;
  @Input() set entry(value: KalturaMediaEntry) {
    if (value) {
      this._entryId = value.id;
      this._entryName = value.name;
      this._entryType = value.mediaType;
      this._duration = value.msDuration || 0;
      this._creationDate = DateFilterUtils.getMomentDate(value.createdAt);
    }
  }
  @Input() owner: string;
  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = { ...viewsConfig.entry };
    }
  }
  @Input() comments: number = null;

  @Output() back = new EventEmitter<void>();
  @Output() navigateToEntry = new EventEmitter<void>();
  
  public _creationDate: moment.Moment = null;
  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _totalCount: number;
  public _reportType: KalturaReportType = KalturaReportType.userUsage;
  public _selectedMetrics: string;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _exportConfig: ExportItem[] = [];
  public _entryId = '';
  public _duration = 0;
  public _entryName = '';
  public _entryType: KalturaMediaType = null;
  public _viewConfig: ViewConfig = { ...viewsConfig.entry };
  
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _frameEventManager: FrameEventManagerService,
              private _exportConfigService: EntryExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }
  
  ngOnDestroy() {
  }
  
  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }
  
  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }
  
  public _onSyndicationDrillDown(event: string): void {
    let update: Partial<ExportItem> = {};
    if (event) {
      update.objectIds = event;
    }
    
    this._exportConfig = EntryExportConfig.updateConfig(this._exportConfigService.getConfig(), 'syndication', update);
  }
  
  public _onGeoDrillDown(event: { reportType: KalturaReportType, drillDown: string[] }): void {
    let update: Partial<ExportItem> = { reportType: event.reportType, additionalFilters: {} };
    
    if (event.drillDown && event.drillDown.length > 0) {
      update.additionalFilters.countryIn = event.drillDown[0];
    }
    
    if (event.drillDown && event.drillDown.length > 1) {
      update.additionalFilters.regionIn = event.drillDown[1];
    }
    
    this._exportConfig = EntryExportConfig.updateConfig(this._exportConfigService.getConfig(), 'geo', update);
  }
  
}
