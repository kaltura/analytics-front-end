import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {KalturaPlaylist, KalturaReportInterval, KalturaReportType} from "kaltura-ngx-client";
import {DateFilterUtils, DateRanges} from "shared/components/date-filter/date-filter-utils";
import {ViewConfig, viewsConfig} from "configuration/view-config";
import {isEmptyObject} from "shared/utils/is-empty-object";
import {DateChangeEvent} from "shared/components/date-filter/date-filter.service";
import {RefineFilter} from "shared/components/filter/filter.component";
import {ExportItem} from "shared/components/export-csv/export-config-base.service";
import {ManualExportConfig} from "./manual-export.config";
import {ManualPlaylistTopContentComponent} from "./views/top-content";
import {TopCountriesComponent} from "shared/components/top-countries-report/top-countries.component";
import {ExportCsvComponent} from "shared/components/export-csv/export-csv.component";
import {CustomSyndicationConfig} from './custom-syndication.config';
import {ReportDataConfig} from "shared/services/storage-data-base.config";
import * as moment from "moment";

@Component({
  selector: 'app-manual-playlist-view',
  templateUrl: './manual-playlist.component.html',
  styleUrls: ['./manual-playlist.component.scss'],
  providers: [ManualExportConfig, CustomSyndicationConfig]
})
export class ManualPlaylistComponent implements OnInit {

  @Input() isChildAccount: boolean;
  @Input() set playlist(value: KalturaPlaylist) {
    if (value) {
      this._playlistId = value.id;
      this._playlistName = value.name;
      this._creationDate = DateFilterUtils.getMomentDate(value.createdAt);
      this._updateDate = DateFilterUtils.getMomentDate(value.updatedAt);
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

  @ViewChild('export', {static: true}) export: ExportCsvComponent;
  @ViewChild('topVideos') set topVideos(comp: ManualPlaylistTopContentComponent) {
    setTimeout(() => { // use timeout to prevent check after init error
      this._playlistTopContentComponent = comp;
    }, 0);
  }
  public _playlistTopContentComponent: ManualPlaylistTopContentComponent;

  @ViewChild('topCountries') set topCountries(comp: TopCountriesComponent) {
    setTimeout(() => { // use timeout to prevent check after init error
      this._topCountriesComponent = comp;
    }, 0);
  }
  public _topCountriesComponent: TopCountriesComponent;

  public _playlistId = '';
  public _playlistName = '';
  public _creationDate: moment.Moment = null;
  public _updateDate: moment.Moment = null;
  public _viewConfig: ViewConfig = { ...viewsConfig.playlist };

  public _dateFilter: DateChangeEvent = null;
  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _exportConfig: ExportItem[] = [];
  public _syndicationConfig: ReportDataConfig;

  public _miniViewsCount = [
    this._viewConfig.miniHighlights,
    this._viewConfig.miniViewersEngagement,
    this._viewConfig.miniTopVideos,
    this._viewConfig.miniTopViewers,
    this._viewConfig.miniInsights
  ].filter(Boolean).length;

  constructor(private _exportConfigService: ManualExportConfig,
              private _customSyndicationConfig: CustomSyndicationConfig) {
    this._syndicationConfig = this._customSyndicationConfig.getConfig();
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

  public _onGeoDrillDown(event: { reportType: KalturaReportType, drillDown: string[] }): void {
    let update: Partial<ExportItem> = { reportType: event.reportType, additionalFilters: {} };

    if (event.drillDown && event.drillDown.length > 0) {
      update.additionalFilters.countryIn = event.drillDown[0];
    }

    if (event.drillDown && event.drillDown.length > 1) {
      update.additionalFilters.regionIn = event.drillDown[1];
    }

    this._exportConfig = ManualExportConfig.updateConfig(this._exportConfigService.getConfig(this._viewConfig), 'geo', update);
  }

  public exportReport(event: { type: string, id: string }): void {
    if (event.type === 'user') {
      this.export._export([{
        parent: true,
        data: {
          id: "performance",
          label: "User Engagement",
          order: "-count_plays",
          reportType: "38",
          sections: [1]
        }
      }], { userIds: event.id });
    }
    if (event.type === 'entry') {
      this.export._export([{
        parent: true,
        data: {
          id: "performance",
          label: "Media Engagement",
          order: "-count_plays",
          reportType: "13",
          sections: [1]
        }
      }], { entryIdIn: event.id });
    }
  }

}
