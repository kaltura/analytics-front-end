import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BaseEntryGetAction,
  KalturaAPIException,
  KalturaClient,
  KalturaDetachedResponseProfile,
  KalturaEntryDisplayInSearchType,
  KalturaLiveEntry,
  KalturaLiveStreamBroadcastStatus,
  KalturaLiveStreamDetails,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaReportInterval,
  KalturaRequestOptions,
  KalturaResponseProfileType,
  KalturaUser,
  LiveStreamGetDetailsAction,
  UserGetAction
} from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { map } from 'rxjs/operators';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {AuthService, ErrorsManagerService, NavigationDrillDownService, ReportHelper} from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import {EntryWebcastExportConfig} from "./entry-webcast-export.config";
import {ExportItem} from "shared/components/export-csv/export-config-base.service";
import {RefineFilter} from "shared/components/filter/filter.component";
import {DateChangeEvent} from "shared/components/date-filter/date-filter.service";
import * as moment from "moment";
import {DateFilterUtils, DateRanges} from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-entry-webcast',
  templateUrl: './entry-webcast-view.component.html',
  styleUrls: ['./entry-webcast-view.component.scss'],
  providers: [EntryWebcastExportConfig]
})
export class EntryWebcastViewComponent implements OnInit, OnDestroy {
  public _viewConfig = analyticsConfig.viewsConfig.entryWebcast;
  public _loadingEntry = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _entry: KalturaLiveEntry;
  public _entryId = '';
  public _entryIdIn = '';
  public _lastBroadcastDuration = '';
  public _isLive = false;
  public _owner = '';
  public _displayCreatedAt = '';
  public _isChildAccount = false;
  public _showViewDetails = false;
  public _exportConfig: ExportItem[] = [];

  public _dateFilter: DateChangeEvent = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;

  public _creationDate: moment.Moment = null;
  public _firstBroadcastDate: moment.Moment = null;
  public _lastBroadcastDate: moment.Moment = null;

  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _selectedRefineFilters: RefineFilter = null;

  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _exportConfigService: EntryWebcastExportConfig,
              private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService,
              private _authService: AuthService) {
  }

  ngOnInit() {
    this._isChildAccount = this._authService.isChildAccount;
    this._exportConfig = this._exportConfigService.getConfig(this._viewConfig);
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        this._entryId = params['id'];
        if (this._entryId) {
          this._loadEntryDetails();
        }
      });
  }

  ngOnDestroy() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

  private _loadEntryDetails(): void {
    this._loadingEntry = true;
    this._blockerMessage = null;

    const request = new KalturaMultiRequest(
      new BaseEntryGetAction({ entryId: this._entryId })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'id,name,mediaType,createdAt,msDuration,userId,displayInSearch,lastBroadcastEndTime,firstBroadcast,lastBroadcast,recordedEntryId,liveStatus,'
          })
        }),
      new UserGetAction({ userId: null })
        .setDependency(['userId', 0, 'userId'])
        .setRequestOptions(
          new KalturaRequestOptions({
            responseProfile: new KalturaDetachedResponseProfile({
              type: KalturaResponseProfileType.includeFields,
              fields: 'id,fullName'
            })
          })
        ),
      new LiveStreamGetDetailsAction({id: this._entryId})
    );

    this._kalturaClient
      .multiRequest(request)
      .pipe(
        cancelOnDestroy(this),
        map((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            const err: KalturaAPIException = responses.getFirstError();
            // do not block view for invalid users. could be a deleted user but we still have the entry Analytics data. Also support KMS weak KS.
            if (err.code !== "INVALID_USER_ID" && err.code !== "CANNOT_RETRIEVE_ANOTHER_USER_USING_NON_ADMIN_SESSION") {
              throw err;
            }
          }

          return [
            responses[0].result,
            responses[1].result,
            responses[2].result
          ] as [KalturaLiveEntry, KalturaUser, KalturaLiveStreamDetails];
        })
      )
      .subscribe(
        ([entry, user, liveStramDetails]) => {
          this._entry = entry;
          this._entryIdIn = entry.id;
          // this._isLive = entry.liveStatus
          this._creationDate = DateFilterUtils.getMomentDate(entry.createdAt);
          if (entry.firstBroadcast) {
            this._firstBroadcastDate = DateFilterUtils.getMomentDate(entry.firstBroadcast);
          }
          if (entry.lastBroadcast) {
            this._lastBroadcastDate = DateFilterUtils.getMomentDate(entry.lastBroadcast);
          }
          if (entry.recordedEntryId) {
            this._entryIdIn += `,${entry.recordedEntryId}`;
          }
          if (entry.lastBroadcastEndTime && entry.lastBroadcast && entry.lastBroadcastEndTime > entry.lastBroadcast) {
            const lastBroadcastEndTime = new Date(entry.lastBroadcastEndTime * 1000);
            const lastBroadcast = new Date(entry.lastBroadcast * 1000);
            this._lastBroadcastDuration = ReportHelper.numberWithCommas(moment(lastBroadcastEndTime).diff(moment(lastBroadcast), 'minutes'));
          }
          this._owner = user && user.fullName ? user.fullName : entry.userId; // fallback for deleted users
          this._showViewDetails = entry.displayInSearch !== KalturaEntryDisplayInSearchType.system;
          this._displayCreatedAt = DateFilterUtils.formatFullDateString(entry.createdAt);
          this._isLive = liveStramDetails.broadcastStatus === KalturaLiveStreamBroadcastStatus.live;
          this._loadingEntry = false;
        },
        error => {
          this._loadingEntry = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadEntryDetails();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }

  public _navigateToEntry(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, '/content/entries/entry/' + this._entryId);
    }
  }
}
