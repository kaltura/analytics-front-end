import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {KalturaPlaylist, KalturaReportInterval} from "kaltura-ngx-client";
import {DateFilterUtils, DateRanges} from "shared/components/date-filter/date-filter-utils";
import {ViewConfig, viewsConfig} from "configuration/view-config";
import {isEmptyObject} from "shared/utils/is-empty-object";
import * as moment from "moment";
import {DateChangeEvent} from "shared/components/date-filter/date-filter.service";
import {RefineFilter} from "shared/components/filter/filter.component";
import {ExportItem} from "shared/components/export-csv/export-config-base.service";
import {ManualExportConfig} from "./manual-export.config";
import {ManualPlaylistTopContentComponent} from "./views/top-content";

@Component({
  selector: 'app-manual-playlist-view',
  templateUrl: './manual-playlist.component.html',
  styleUrls: ['./manual-playlist.component.scss'],
  providers: [ManualExportConfig]
})
export class ManualPlaylistComponent implements OnInit {

  @Input() isChildAccount: boolean;
  @Input() set playlist(value: KalturaPlaylist) {
    if (value) {
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
  @Output() navigateToPlaylist = new EventEmitter<void>();

  @ViewChild('topVideos') set topVideos(comp: ManualPlaylistTopContentComponent) {
    setTimeout(() => { // use timeout to prevent check after init error
      this._playlistTopContentComponent = comp;
    }, 0);
  }
  public _playlistTopContentComponent: ManualPlaylistTopContentComponent;

  public _playlistId = '';
  public _playlistName = '';
  public _creationDate: moment.Moment = null;
  public _viewConfig: ViewConfig = { ...viewsConfig.playlist };

  public _dateFilter: DateChangeEvent = null;
  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _exportConfig: ExportItem[] = [];

  public _miniViewsCount = [
    this._viewConfig.miniHighlights,
    this._viewConfig.miniViewersEngagement,
    this._viewConfig.miniTopVideos,
    this._viewConfig.miniTopViewers,
    this._viewConfig.miniInsights
  ].filter(Boolean).length;

  constructor(private _exportConfigService: ManualExportConfig) {
  }

  ngOnInit() {
    this._exportConfig = this._exportConfigService.getConfig(this._viewConfig);
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

}
