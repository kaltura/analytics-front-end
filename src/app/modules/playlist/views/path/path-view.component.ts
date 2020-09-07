import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {KalturaPlaylist, KalturaPlaylistType, KalturaReportInterval, KalturaReportType} from 'kaltura-ngx-client';
import {DateChangeEvent} from 'shared/components/date-filter/date-filter.service';
import {RefineFilter} from 'shared/components/filter/filter.component';
import {FrameEventManagerService} from 'shared/modules/frame-event-manager/frame-event-manager.service';
import * as moment from 'moment';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {ExportItem} from 'shared/components/export-csv/export-config-base.service';
import {ErrorsManagerService} from 'shared/services';
import {DateFilterUtils, DateRanges} from 'shared/components/date-filter/date-filter-utils';
import {PathExportConfig} from './path-export.config';
import {ViewConfig, viewsConfig} from 'configuration/view-config';
import {isEmptyObject} from 'shared/utils/is-empty-object';
import {reportTypeMap} from "shared/utils/report-type-map";

@Component({
  selector: 'app-path',
  templateUrl: './path-view.component.html',
  styleUrls: ['./path-view.component.scss'],
  providers: [
    PathExportConfig,
  ]
})
export class PathViewComponent implements OnInit, OnDestroy {
  @Input() isChildAccount: boolean;
  @Input() set playlist(value: KalturaPlaylist) {
    if (value) {
      this._isPath = value.playlistType === KalturaPlaylistType.path;
      this._playlistId = value.id;
      this._playlistName = value.name;
      this._creationDate = DateFilterUtils.getMomentDate(value.createdAt);
    }
  }
  @Input() owner: string;
  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = { ...viewsConfig.playlist };
    }
  }

  @Output() back = new EventEmitter<void>();

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
  public _playlistId = '';
  public _playlistName = '';
  public _isPath = false;
  public _viewConfig: ViewConfig = { ...viewsConfig.playlist };
  public _totalsReportType = reportTypeMap(KalturaReportType.userInteractiveVideo);


  constructor(private _errorsManager: ErrorsManagerService,
              private _frameEventManager: FrameEventManagerService,
              private _exportConfigService: PathExportConfig) {

  }

  ngOnInit() {
    this._exportConfig = this._exportConfigService.getConfig(this._viewConfig);
  }

  ngOnDestroy() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

}
