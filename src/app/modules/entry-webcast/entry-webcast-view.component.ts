import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {WebcastEntryUserEngagementComponent} from "./views/user-engagement/user-engagement.component";
import {PageScrollConfig, PageScrollInstance, PageScrollService} from "ngx-page-scroll";

@Component({
  selector: 'app-entry-webcast',
  templateUrl: './entry-webcast-view.component.html',
  styleUrls: ['./entry-webcast-view.component.scss'],
  providers: [EntryWebcastExportConfig]
})
export class EntryWebcastViewComponent implements OnInit, OnDestroy {
  private _userEngagement: WebcastEntryUserEngagementComponent;
  @ViewChild('userEngagement') set content(content: WebcastEntryUserEngagementComponent) {
    if(content) { // initially setter gets called with undefined
      this._userEngagement = content;
    }
  }
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
  public _exporting = false;

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
              private pageScrollService: PageScrollService,
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
            fields: 'id,name,mediaType,createdAt,duration,userId,displayInSearch,lastBroadcastEndTime,firstBroadcast,lastBroadcast,recordedEntryId,liveStatus,thumbnailUrl'
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
          this._creationDate = DateFilterUtils.getMomentDate(entry.createdAt);
          if (entry.firstBroadcast) {
            this._firstBroadcastDate = DateFilterUtils.getMomentDate(entry.firstBroadcast);
          }
          if (entry.lastBroadcast) {
            this._lastBroadcastDate = DateFilterUtils.getMomentDate(entry.lastBroadcast);
          }
          if (entry.recordedEntryId) {
            this._entryIdIn += `${analyticsConfig.valueSeparator}${entry.recordedEntryId}`;
          }
          if (entry.duration) {
            this._lastBroadcastDuration = ReportHelper.numberWithCommas((entry.duration / 60).toFixed(2));
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

  public _viewKnownUsers(): void {
    this._userEngagement._showTable = true;
    setTimeout(() => {
      this._userEngagement._onSortChanged({order: -1, field: 'live_engaged_users_play_time_ratio'});
    }, 100);
    this.scrollTo('#userEngagement');
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }

  public _navigateToEntry(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, '/content/entries/entry/' + this._entryId);
    }
  }

  public _navigateToLive(): void {
    this._navigationDrillDownService.drilldown('entry-live', this._entryId, false, this._authService.pid);
  }

  // PDF export methods
  public preExportHandler(): void {
    this._viewConfig.entryPreview = null;
    this._viewConfig.userEngagement = null;
    this._viewConfig.devices = null;
    this._viewConfig.export = null;
    this._viewConfig.refineFilter = null;
  }

  public postExportHandler(): void {
    this._viewConfig.entryPreview = {};
    this._viewConfig.userEngagement = {
      userFilter: {}
    };
    this._viewConfig.devices = {};
    this._viewConfig.export = {};
    this._viewConfig.refineFilter = {
      playbackType: {},
      owners: {},
      devices: {},
      browsers: {},
      domains: {},
      os: {},
      geo: {}
    };
  }

  public onExporting(exporting: boolean): void {
    this._exporting = exporting;
  }
}
