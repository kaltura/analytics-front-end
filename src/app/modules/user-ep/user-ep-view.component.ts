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
import {ExportConfig} from './export.config';
import * as moment from 'moment';

@Component({
  selector: 'app-ep-user',
  templateUrl: './user-ep-view.component.html',
  styleUrls: ['./user-ep-view.component.scss'],
  providers: [ExportConfig]
})
export class UserEpViewComponent implements OnInit, OnDestroy {

  public _viewConfig = analyticsConfig.viewsConfig.userEP;
  public _blockerMessage: AreaBlockerMessage = null;
  public _eventId: string;
  public _userId = '';
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
        this._eventId = params['eventId'];
        this._userId = params['userId'];
      });
  }

  ngOnDestroy() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }




}
