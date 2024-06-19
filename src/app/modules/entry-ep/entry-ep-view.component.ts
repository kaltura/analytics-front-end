import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  BaseEntryGetAction,
  KalturaAPIException,
  KalturaClient,
  KalturaEntryScheduleEventFilter,
  KalturaLiveEntry,
  KalturaMeetingScheduleEvent,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaReportInterval, KalturaRoomEntry,
  KalturaScheduleEventListResponse,
  ScheduleEventListAction
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

  public _liveEntryIds = '';
  public _vodEntryIds = '';
  public _recordingEntryId = '';
  public _allEntryIds = '';

  private _saveTitleConfig = this._viewConfig.title;

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

  private _loadEventDetails(): void {
    this._loadingEntry = true;
    this._blockerMessage = null;

    const request = new KalturaMultiRequest(
        new BaseEntryGetAction({ entryId: this._entryId }),
        new ScheduleEventListAction({filter: new KalturaEntryScheduleEventFilter({templateEntryIdEqual: this._entryId})})
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
          responses[1].result
        ] as [KalturaRoomEntry | KalturaLiveEntry, KalturaScheduleEventListResponse];
      }))
      .subscribe(
        ([entry, eventList]) => {
          if (!entry) {
            return;
          }
          // set start and edit date
          if (eventList?.objects?.length > 0) {
            const event: KalturaMeetingScheduleEvent = eventList.objects[0] as KalturaMeetingScheduleEvent;

            this._actualEventStartDate = new Date(event.startDate * 1000); // save actual start date before calculating round down start date
            this._eventStartDate = new Date(this._actualEventStartDate.getTime()); // copy the actual start dat object
            // need to round down to the last half hour because this is our data aggregation interval
            const minutes = this._actualEventStartDate.getMinutes();
            if (minutes !== 0 && minutes !== 30) {
              const roundDownMinutes = minutes > 30 ? 30 : 0;
              this._eventStartDate.setMinutes(roundDownMinutes); // round down minutes
              this._eventStartDate.setSeconds(0); // round down seconds
            }
            this._eventEndDate = new Date(event.endDate * 1000);
          }
          // set live and vod entry IDs string
          this._entry = entry;
          this._liveEntryIds = entry.id;
          if (entry.redirectEntryId) {
            this._vodEntryIds = entry.redirectEntryId;
          }
          this._allEntryIds = entry.redirectEntryId ? `${this._liveEntryIds}${analyticsConfig.valueSeparator}${this._vodEntryIds}` : this._liveEntryIds;
          if (entry.referenceId) { // DIY Live Broadcast
            this._liveEntryIds += `${analyticsConfig.valueSeparator}${entry.referenceId}`;
            this._allEntryIds += `${analyticsConfig.valueSeparator}${entry.referenceId}`;
            this._kalturaClient
              .request(new BaseEntryGetAction({ entryId: entry.referenceId }))
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
            endDate: Math.floor(this._eventEndDate.getTime() / 1000),
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
    this._viewConfig.devices = null;
    this._viewConfig.title = {}; // force show title for export
    this._analytics.trackButtonClickEvent(ButtonType.Export, 'Events_session_PDF');
  }

  public postExportHandler(): void {
    this._viewConfig.devices = {};
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
