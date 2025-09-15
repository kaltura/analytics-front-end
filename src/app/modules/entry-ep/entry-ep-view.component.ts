import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  BaseEntryGetAction, CuePointListAction,
  KalturaAPIException,
  KalturaClient, KalturaCuePointListResponse,
  KalturaEntryScheduleEventFilter,
  KalturaLiveEntry,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaReportInterval, KalturaRoomEntry,
  KalturaScheduleEventListResponse,
  ScheduleEventListAction,
  KalturaCuePointType,
  KalturaSessionCuePointFilter,
  KalturaSessionCuePoint, KalturaLiveStreamScheduleEvent, KalturaNullableBoolean
} from 'kaltura-ngx-client';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {FrameEventManagerService, FrameEvents} from 'shared/modules/frame-event-manager/frame-event-manager.service';
import {analyticsConfig} from 'configuration/analytics-config';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {AppAnalytics, ButtonType, ErrorsManagerService, NavigationDrillDownService} from 'shared/services';
import {ExportItem} from "shared/components/export-csv/export-config-base.service";
import {DateChangeEvent} from "shared/components/date-filter/date-filter.service";
import {DateFilterUtils, DateRanges} from "shared/components/date-filter/date-filter-utils";
import {PageScrollConfig, PageScrollInstance, PageScrollService} from "ngx-page-scroll";
import {KalturaLogger} from "@kaltura-ng/kaltura-logger";
import {map} from 'rxjs/operators';
import {ExportConfig} from "./export.config";
import * as moment from 'moment';

@Component({
  selector: 'app-ep-webcast',
  templateUrl: './entry-ep-view.component.html',
  styleUrls: ['./entry-ep-view.component.scss'],
  providers: [ExportConfig]
})
export class EntryEpViewComponent implements OnInit, OnDestroy {

  public _viewConfig = analyticsConfig.viewsConfig.entryEP;
  public _loadingEntry = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _entry: KalturaLiveEntry | KalturaRoomEntry;
  public _entryId = '';
  public _exportConfig: ExportItem[] = [];
  public _exporting = false;
  public _exportDateFilter: DateChangeEvent = null;

  public _dateFilter: DateChangeEvent = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;

  public _creationDate: Date = null;
  public _eventStartDate: Date = null;
  public _actualEventStartDate: Date = null;
  public _eventEndDate: Date = null;
  public _now: Date = new Date();

  public _eventId = parseInt(analyticsConfig.customData.eventId) || 0;
  public _liveEntryIds = '';
  public _vodEntryIds = '';
  public _recordingEntryId = '';
  public _isSimulive = false;
  public _isExplicitLive = false;
  public _allEntryIds = '';

  private _saveTitleConfig = this._viewConfig.title;

  private _cuePoints: KalturaSessionCuePoint[] = [];
  public _selectedCuePoint: KalturaSessionCuePoint = null;
  public _cuepointOptions = [];
  public _isVirtualClassroom = true;

  constructor(private _router: Router,
              private _analytics: AppAnalytics,
              private _route: ActivatedRoute,
              private _exportConfigService: ExportConfig,
              private _kalturaClient: KalturaClient,
              protected _logger: KalturaLogger,
              private _errorsManager: ErrorsManagerService,
              private pageScrollService: PageScrollService,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._logger = _logger.subLogger('EntryEpViewComponent');
  }

  ngOnInit() {
    this._exportConfig = this._exportConfigService.getConfig();
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        this._entryId = params['id'];
        if (this._entryId) {
          this._loadEventDetails();
        }
      });
  }

  ngOnDestroy() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  // set start and end date
  private setStartEndDates(startDate: number, endDate: number) {
    this._actualEventStartDate = new Date(startDate * 1000); // save actual start date before calculating round down start date
    this._eventStartDate = new Date(this._actualEventStartDate.getTime()); // copy the actual start date object
    // need to round down to the last hour because this is our data aggregation interval
    const minutes = this._actualEventStartDate.getMinutes();
    if (minutes !== 0) {
      this._eventStartDate.setMinutes(0); // round down minutes
      this._eventStartDate.setSeconds(0); // round down seconds
    }
    this._eventEndDate = new Date(endDate * 1000);
  }

  private isValidEntryId(entryId: string): boolean {
    return /^[0-9]_[0-9a-z]{8}$/i.test(entryId);
  }

  private _loadEventDetails(): void {
    this._loadingEntry = true;
    this._blockerMessage = null;

    const request = new KalturaMultiRequest(
        new BaseEntryGetAction({ entryId: this._entryId }),
        new ScheduleEventListAction({filter: new KalturaEntryScheduleEventFilter({templateEntryIdEqual: this._entryId})}),
        new CuePointListAction({filter: new KalturaSessionCuePointFilter({orderBy: '-startTime', cuePointTypeEqual: KalturaCuePointType.session, entryIdEqual: this._entryId, endTimeLessThanOrEqual: this._now.getTime() / 1000 })})
      );

    this._kalturaClient
      .multiRequest(request)
      .pipe(cancelOnDestroy(this),
      map((responses: KalturaMultiResponse) => {
        if (responses.hasErrors()) {
          const err: KalturaAPIException = responses.getFirstError();
          this._loadingEntry = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadEventDetails();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(err, actions);
          return [];
        }
        return [
          responses[0].result,
          responses[1].result,
          responses[2].result
        ] as [KalturaRoomEntry | KalturaLiveEntry, KalturaScheduleEventListResponse, KalturaCuePointListResponse];
      }))
      .subscribe(
        ([entry, eventList, cuePoints]) => {
          if (!entry) {
            return;
          }
          this._isExplicitLive = (entry as KalturaLiveEntry).explicitLive ? (entry as KalturaLiveEntry).explicitLive === KalturaNullableBoolean.trueValue : false;
          if (eventList?.objects?.length > 0) {
            this._isVirtualClassroom = false;
            const event: KalturaLiveStreamScheduleEvent = eventList.objects[0] as KalturaLiveStreamScheduleEvent;
            this.setStartEndDates(event.startDate, event.endDate);
            if (event.sourceEntryId) {
              this._isSimulive = true;
              this._vodEntryIds = event.sourceEntryId;
            }
          } else {
            if (cuePoints?.objects?.length > 0) {
              // no schedule event means this is a virtual classroom. Sessions should be taken for the entry session cuepoints
              this._isVirtualClassroom = true;
              this._cuePoints = cuePoints.objects;
              this._selectedCuePoint = this._cuePoints[0];
              this._cuepointOptions = [];
              this._cuePoints.forEach(cuepoint => {
                if (cuepoint.duration > 0) {
                  const duration = moment.duration(cuepoint.duration, 'seconds');
                  const format = cuepoint.duration > 3599 ? 'HH:mm:ss' : 'mm:ss';
                  this._cuepointOptions.push({
                    label: `${moment(cuepoint.startTime * 1000).format('MMMM DD, YYYY')}\u00A0\u00A0\u00A0${moment(cuepoint.startTime * 1000).format('HH:mm')} - ${moment(cuepoint.endTime * 1000).format('HH:mm')}\u00A0\u00A0\u00A0(${moment.utc(duration.as('milliseconds')).format(format)})`,
                    value: cuepoint
                  });
                }
              });
              this.setStartEndDates(this._selectedCuePoint.startTime, this._selectedCuePoint.endTime);
            }
          }
          // set live and vod entry IDs string
          this._entry = entry;
          this._liveEntryIds = entry.id;
          if (entry.redirectEntryId && !this._isSimulive) {
            this._vodEntryIds = entry.redirectEntryId;
          }
          this._allEntryIds = entry.redirectEntryId ? `${this._liveEntryIds}${analyticsConfig.valueSeparator}${this._vodEntryIds}` : this._liveEntryIds;
          if ((entry.broadcastEntryId && this.isValidEntryId(entry.broadcastEntryId)) || (entry.referenceId && this.isValidEntryId(entry.referenceId)) ) { // DIY Live Broadcast
            const liveEntryId = entry.broadcastEntryId ? entry.broadcastEntryId : entry.referenceId; // prefer broadcastEntryId
            this._liveEntryIds += `${analyticsConfig.valueSeparator}${liveEntryId}`;
            this._allEntryIds += `${analyticsConfig.valueSeparator}${liveEntryId}`;
            this._kalturaClient
              .request(new BaseEntryGetAction({ entryId: liveEntryId }))
              .pipe(cancelOnDestroy(this))
              .subscribe(
                (referenceEntry: KalturaRoomEntry) => {
                  if (referenceEntry.redirectEntryId) {
                    this._vodEntryIds = this._vodEntryIds.length ? `${this._vodEntryIds}${analyticsConfig.valueSeparator}${referenceEntry.redirectEntryId}` : referenceEntry.redirectEntryId;
                    this._allEntryIds += `${analyticsConfig.valueSeparator}${referenceEntry.redirectEntryId}`;
                  }
                  this._loadingEntry = false;
                },
                error => {
                  this._loadingEntry = false;
                  const actions = {
                    'close': () => {
                      this._blockerMessage = null;
                    },
                    'retry': () => {
                      this._loadEventDetails();
                    },
                  };
                  this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
                });
          } else {
            this._loadingEntry = false;
          }
          // we will use the webcast recording if available for the recording preview. If not available - use the room recording instead;
          this._recordingEntryId = this._vodEntryIds.split(analyticsConfig.valueSeparator)[0];
          this._exportDateFilter = {
            startDate: Math.floor(this._eventStartDate.getTime() / 1000),
            endDate: Math.floor((new Date()).getTime() / 1000),
            timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
            timeUnits: KalturaReportInterval.days,
            endDay: null,
            startDay: null,
            compare: null
          };
        },
        error => {
          this._loadingEntry = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadEventDetails();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  public onCuepointChange(): void {
    this._analytics.trackButtonClickEvent(ButtonType.Choose, 'VC_session_select_session_dropdown', null, 'VC_session_dashboard');
    this.setStartEndDates(this._selectedCuePoint.startTime, this._selectedCuePoint.endTime);
  }

  private scrollTo(target: string): void {
    if (analyticsConfig.isHosted) {
      const targetEl = document.getElementById(target.substr(1)) as HTMLElement;
      if (targetEl) {
        this._frameEventManager.publish(FrameEvents.ScrollTo, targetEl.offsetTop);
      }
    } else {
      PageScrollConfig.defaultDuration = 500;
      const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(document, target);
      this.pageScrollService.start(pageScrollInstance);
    }
  }

  public preExportHandler(): void {
    this._viewConfig.devices = this._isVirtualClassroom ? {} : null;
    this._viewConfig.title = {}; // force show title for export
    this._viewConfig.polls = null; // hide polls as it has its own export to pdf
    if (this._isVirtualClassroom) {
      this._analytics.trackButtonClickEvent(ButtonType.Download, 'VC_session_pdf_download', null, 'VC_session_dashboard');
    } else {
      this._analytics.trackButtonClickEvent(ButtonType.Export, 'Events_session_PDF');
    }
  }

  public postExportHandler(): void {
    this._viewConfig.devices = {};
    this._viewConfig.polls = {};
    this._viewConfig.title = this._saveTitleConfig; // restore title settings
    // force refresh of graph elements width
    document.getElementById('ep-session-graph').style.width = '1000px';
    setTimeout(() => {
      document.getElementById('ep-session-graph').style.width = '100%';
    }, 0);
  }

  public onExporting(exporting: boolean): void {
    this._exporting = exporting;
  }

  public onExport(): void {
    this._analytics.trackButtonClickEvent(ButtonType.Export, 'Events_session_export_report');
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }

}
