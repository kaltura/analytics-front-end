import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BaseEntryGetAction,
  KalturaAPIException,
  KalturaClient,
  KalturaEntryScheduleEventFilter,
  KalturaLiveEntry,
  KalturaMediaEntry,
  KalturaMeetingScheduleEvent,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaReportInterval,
  KalturaScheduleEventListResponse,
  ScheduleEventListAction } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { EntryEPExportConfig } from "./entry-ep-export.config";
import { ExportItem } from "shared/components/export-csv/export-config-base.service";
import { DateChangeEvent } from "shared/components/date-filter/date-filter.service";
import { DateFilterUtils, DateRanges } from "shared/components/date-filter/date-filter-utils";
import { PageScrollConfig, PageScrollInstance, PageScrollService } from "ngx-page-scroll";
import { KalturaLogger } from "@kaltura-ng/kaltura-logger";
import { map } from 'rxjs/operators';
import * as moment from "moment";

@Component({
  selector: 'app-ep-webcast',
  templateUrl: './entry-ep-view.component.html',
  styleUrls: ['./entry-ep-view.component.scss'],
  providers: [EntryEPExportConfig]
})
export class EntryEpViewComponent implements OnInit, OnDestroy {

  public _viewConfig = analyticsConfig.viewsConfig.entryEP;
  public _loadingEntry = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _entry: KalturaLiveEntry | KalturaMediaEntry;
  public _entryId = '';
  public _exportConfig: ExportItem[] = [];

  public _dateFilter: DateChangeEvent = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;

  public _creationDate: moment.Moment = null;
  public _eventStartDate: moment.Moment = null;
  public _eventEndDate: moment.Moment = null;

  public _liveEntryIds = '';
  public _vodEntryIds = '';
  public _allEntryIds = '';

  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _exportConfigService: EntryEPExportConfig,
              private _kalturaClient: KalturaClient,
              protected _logger: KalturaLogger,
              private _errorsManager: ErrorsManagerService,
              private pageScrollService: PageScrollService,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._logger = _logger.subLogger('EntryEpViewComponent');
  }

  ngOnInit() {
    this._exportConfig = this._exportConfigService.getConfig(this._viewConfig);
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        this._entryId = params['id'];
        if (this._entryId) {
          this._loadEventDetails();
          setTimeout(() => {
            console.log("---> live entry IDS: " + this._liveEntryIds);
            console.log("---> vod entry IDS: " + this._vodEntryIds);
            console.log("---> all entry IDS: " + this._allEntryIds);
            console.log("---> start date: " + this._eventStartDate);
            console.log("---> end date: " + this._eventEndDate);
          }, 5000);
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
          this._logger.error('Error retrieving entry by referenceId', err);
        }
        return [
          responses[0].result,
          responses[1].result
        ] as [KalturaMediaEntry | KalturaLiveEntry, KalturaScheduleEventListResponse];
      }))
      .subscribe(
        ([entry, eventList]) => {
          // set start and edit date
          if (eventList?.objects?.length > 0) {
            const event: KalturaMeetingScheduleEvent = eventList.objects[0] as KalturaMeetingScheduleEvent;
            this._eventStartDate = DateFilterUtils.getMomentDate(event.startDate);
            this._eventEndDate = DateFilterUtils.getMomentDate(event.endDate);
          }
          // set live and vod entry IDs string
          this._entry = entry;
          this._liveEntryIds = entry.id;
          if (entry.redirectEntryId) {
            this._vodEntryIds = entry.redirectEntryId;
          }
          this._allEntryIds = entry.redirectEntryId ? `${this._liveEntryIds},${this._vodEntryIds}` : this._liveEntryIds;
          if (entry.referenceId) { // DIY Live Broadcast
            this._liveEntryIds += `,${entry.referenceId}`;
            this._allEntryIds += `,${entry.referenceId}`;
            this._kalturaClient
              .request(new BaseEntryGetAction({ entryId: entry.referenceId }))
              .pipe(cancelOnDestroy(this))
              .subscribe(
                (referenceEntry: KalturaMediaEntry) => {
                  if (referenceEntry.redirectEntryId) {
                    this._vodEntryIds = this._vodEntryIds.length ? `${this._vodEntryIds},${referenceEntry.redirectEntryId}` : referenceEntry.redirectEntryId;
                    this._allEntryIds += `,${referenceEntry.redirectEntryId}`;
                  }
                  this._loadingEntry = false;
                },
                error => {
                  this._loadingEntry = false;
                  this._logger.error('Error retrieving entry by referenceId', error);
                });
          } else {
            this._loadingEntry = false;
          }
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

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }

}
