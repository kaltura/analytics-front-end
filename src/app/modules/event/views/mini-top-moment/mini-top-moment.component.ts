import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import {analyticsConfig, getKalturaServerUri} from "configuration/analytics-config";
import {AppAnalytics, AuthService, ButtonType, ErrorsManagerService, ReportConfig, ReportService} from "shared/services";
import {AreaBlockerMessage} from "@kaltura-ng/kaltura-ui";
import {
  BaseEntryGetAction,
  KalturaAPIException,
  KalturaClient,
  KalturaEndUserReportInputFilter, KalturaEntryScheduleEventFilter,
  KalturaFilterPager,
  KalturaLiveEntry, KalturaLiveStreamScheduleEvent,
  KalturaMediaEntry, KalturaMeetingScheduleEvent,
  KalturaMultiRequest, KalturaMultiResponse,
  KalturaReportInterval,
  KalturaReportTable,
  KalturaReportType,
  KalturaRoomEntry, KalturaScheduleEventListResponse,
  ScheduleEventListAction
} from "kaltura-ngx-client";
import {MiniTopMomentConfig} from "./mini-top-moment.config";
import {ReportDataConfig} from "shared/services/storage-data-base.config";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {map} from "rxjs/operators";

@Component({
  selector: 'app-event-mini-top-moment',
  templateUrl: './mini-top-moment.component.html',
  styleUrls: ['./mini-top-moment.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopMomentComponent'),
    MiniTopMomentConfig,
    ReportService,
  ]
})

export class MiniTopMomentComponent implements OnInit, OnDestroy {

  protected _componentId = 'event-mini-top-moment';

  @Input() eventActualStartDate: Date;
  @Input() eventStartDate: Date;
  @Input() eventEndDate: Date;
  @Input() eventIn = '';
  @Input() set virtualEventLoaded(value: boolean) {
    if (value === true) {
      // use timeout to allow data binding to finish
      setTimeout(() => {
        this._loadReport();
      }, 0);
    }
  }

  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  private _dataConfig: ReportDataConfig;
  private _order = '-combined_live_view_period_count';
  private _reportType = KalturaReportType.epTopMoments;
  private _pager = new KalturaFilterPager({ pageSize: 1, pageIndex: 1 });
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  private _liveEntryPosition = 0;

  public serverUri = getKalturaServerUri();
  public _playerConfig: any = {};

  public _noData = false;
  public _entryId = '';
  public _entryName = '';
  public _seekFrom = 0;
  public _clipTo = 0;
  public _peakViewers = '';

  public _playerInstance: any = {};
  public _playing = false;

  constructor(private _authService: AuthService,
              private _analytics: AppAnalytics,
              private _reportService: ReportService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              _dataConfigService: MiniTopMomentConfig) {
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit(): void {
    this._playerConfig = {
      uiconfid: analyticsConfig.kalturaServer.previewUIConfV7,
      pid: this._authService.pid,
      ks: this._authService.ks,
      plugins: {
        "download": {
          "displaySources": true,
          "displayFlavors": true,
          "displayCaptions": true,
          "displayAttachments": true
        }
      }
    };
  }

  private _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._noData = false;
    this._blockerMessage = null;
    this._filter.virtualEventIdIn = this.eventIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.fromDate = Math.floor(this.eventStartDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.eventEndDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, order: this._order, pager: this._pager };
    this._reportService.getReport(reportConfig, sections, false).subscribe(
      report => {
        if (report.table && report.table.data && report.table.header) {
          this._handleTable(report.table); // handle table
        } else {
          this._isBusy = false;
          this._noData = true;
        }
      },
      error => {
        this._isBusy = false;
        this.displayServerError(error, () => this._loadReport());
      }
    );
  }

  private _handleTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    if (tableData.length > 0) {
      this._entryName = tableData[0].entry_name;
      this._peakViewers = tableData[0].combined_live_view_period_count;
      this._liveEntryPosition = parseInt(tableData[0].position);
      this.loadRecordingEntry(tableData[0].entry_id);
    }
  }

  private loadRecordingEntry(liveEntryId: string): void {
    this._kalturaClient
      .request(new BaseEntryGetAction({ entryId: liveEntryId }))
      .pipe(cancelOnDestroy(this)).subscribe(
      (entry: KalturaLiveEntry | KalturaRoomEntry) => {
          if ((entry as KalturaLiveEntry).recordedEntryId || entry.redirectEntryId) {
            // need to load the recording entry to get its creation date and the session scheduled event to get the session start time
            const vod = (entry as KalturaLiveEntry).recordedEntryId || entry.redirectEntryId;
            const request = new KalturaMultiRequest(
              new BaseEntryGetAction({ entryId: vod }),
              new ScheduleEventListAction({filter: new KalturaEntryScheduleEventFilter({templateEntryIdEqual: liveEntryId})})
            );
            this._kalturaClient
              .multiRequest(request)
              .pipe(cancelOnDestroy(this),
              map((responses: KalturaMultiResponse) => {
              if (responses.hasErrors()) {
                const error: KalturaAPIException = responses.getFirstError();
                this.displayServerError(error, () => this.loadRecordingEntry(liveEntryId));
                return [];
              }
              return [
                responses[0].result,
                responses[1].result
              ] as [KalturaMediaEntry, KalturaScheduleEventListResponse];
              }))
              .subscribe(
              ([recording, eventList]) => {
                if (eventList?.objects?.length > 0) {
                  // calculate start point of the video
                  const event: KalturaLiveStreamScheduleEvent = eventList.objects[0] as KalturaLiveStreamScheduleEvent;
                  const liveOffsetFromStart = this._liveEntryPosition - event.startDate;
                  const recordingOffset = event.startDate - recording.createdAt;
                  let recordingPosition = liveOffsetFromStart + recordingOffset;

                  // for simulive, the recording is a predefined entry with older creation date so we set its start time to the session start time if the difference in more than 15 minutes
                  if (event.sourceEntryId) {
                    recordingPosition = liveOffsetFromStart;
                  }
                  recordingPosition = recordingPosition < 0 ? 0 : recordingPosition; // protect from negative values
                  this._seekFrom = recordingPosition;
                  this._clipTo = recordingPosition + 60; // play 1 minute from start position
                  this._entryId = event.sourceEntryId ? event.sourceEntryId : vod; // for simulive take the event source entry ID, otherwise take the live entry recordedEntryId or redirectEntryId
                  this._isBusy = false;
                } else {
                  this._noData = true;
                }
              },
              error => {
                this.displayServerError(error, () => this.loadRecordingEntry(liveEntryId));
              }
            );
          } else {
            this._noData = true;
          }
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          this.displayServerError(error, () => this.loadRecordingEntry(liveEntryId));
        }
      );
  }

  private displayServerError(error: KalturaAPIException, retryFunction: Function): void {
    const actions = {
      'close': () => {
        this._blockerMessage = null;
      },
      'retry': () => {
        retryFunction();
      },
    };
    this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
  }

  public _onPlayerReady(player): void {
    this._playerInstance = player;
    this._playerInstance.addEventListener(this._playerInstance.Event.PLAY, event => {
      this._analytics.trackButtonClickEvent(ButtonType.Launch, 'Events_event_top_moment_play', null, 'Event_dashboard');
      this._playing = true;
    });
    this._playerInstance.addEventListener(this._playerInstance.Event.PAUSE, event => {
      this._analytics.trackButtonClickEvent(ButtonType.Close, 'Events_event_top_moment_pause', null, 'Event_dashboard');
    });
    this._playerInstance.addEventListener(this._playerInstance.Event.MUTE_CHANGE, event => {
      if (this._playing) { // prevent reporting initial unmute event send by the player on load
        const name = event.payload?.mute ? 'Events_event_top_moment_mute' : 'Events_event_top_moment_unmute';
        this._analytics.trackButtonClickEvent(ButtonType.Choose, name, null, 'Event_dashboard');
      }
    });
    this._playerInstance.addEventListener('download_item_clicked', event => {
      this._analytics.trackButtonClickEvent(ButtonType.Download, 'Events_event_top_moment_dowonload', null, 'Event_dashboard');
    });
  }

  ngOnDestroy(): void {
  }

}

