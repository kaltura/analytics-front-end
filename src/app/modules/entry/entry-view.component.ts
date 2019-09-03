import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ISubscription } from 'rxjs/Subscription';
import {
  BaseEntryGetAction,
  KalturaClient,
  KalturaDetachedResponseProfile,
  KalturaMediaEntry,
  KalturaMediaType,
  KalturaMultiRequest,
  KalturaMultiResponse,
  KalturaReportInputFilter,
  KalturaReportInterval,
  KalturaReportType,
  KalturaRequestOptions,
  KalturaResponseProfileType,
  KalturaUser,
  UserGetAction
} from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { filter, map } from 'rxjs/operators';
import * as moment from 'moment';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { EntryExportConfig } from './entry-export.config';
import { EngagementExportConfig } from '../audience/views/engagement/engagement-export.config';
import { reportTypeMap } from 'shared/utils/report-type-map';

@Component({
  selector: 'app-entry',
  templateUrl: './entry-view.component.html',
  styleUrls: ['./entry-view.component.scss'],
  providers: [
    EntryExportConfig,
  ]
})
export class EntryViewComponent implements OnInit, OnDestroy {
  public _loadingEntry = false;
  public _creationDate: moment.Moment = null;
  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _totalCount: number;
  public _reportType: KalturaReportType = reportTypeMap(KalturaReportType.userUsage);
  public _selectedMetrics: string;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _exportConfig: ExportItem[] = [];
  public _filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private requestSubscription: ISubscription;
  private subscription: ISubscription;


  public _entryId = '';
  public _duration = 0;
  public _entryName = '';
  public _entryType: KalturaMediaType = null;
  public _owner = '';
  public _isChildAccount = false;

  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService,
              private _authService: AuthService,
              private _exportConfigService: EntryExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }

  ngOnInit() {
    this._isChildAccount = this._authService.isChildAccount;
    this.subscription = this._route.params.subscribe(params => {
      this._entryId = params['id'];
      if (this._entryId) {
        this.loadEntryDetails();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    if (this.requestSubscription) {
      this.requestSubscription.unsubscribe();
      this.requestSubscription = null;
    }
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

  private loadEntryDetails(): void {
    this._loadingEntry = true;
    this._blockerMessage = null;

    const request = new KalturaMultiRequest(
      new BaseEntryGetAction({ entryId: this._entryId })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'name,mediaType,createdAt,msDuration,userId'
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
        )
    );

    this.requestSubscription = this._kalturaClient
      .multiRequest(request)
      .pipe(
        cancelOnDestroy(this),
        map((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            throw responses.getFirstError();
          }
  
          return [responses[0].result, responses[1].result] as [KalturaMediaEntry, KalturaUser];
        })
      )
      .subscribe(
        ([entry, user]) => {
          this._entryName = entry.name;
          this._entryType = entry.mediaType;
          this._duration = entry.msDuration || 0;
          this._creationDate = DateFilterUtils.getMomentDate(entry.createdAt);
          this._owner = user.fullName;
          this.requestSubscription = null;
          this._loadingEntry = false;
        },
        error => {
          this.requestSubscription = null;
          this._loadingEntry = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this.loadEntryDetails();
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
  
  public _onSyndicationDrillDown(event: string): void {
    let update: Partial<ExportItem> = {};
    if (event) {
      update.objectIds = event;
    }
    
    this._exportConfig = EngagementExportConfig.updateConfig(this._exportConfigService.getConfig(), 'syndication', update);
  }

  public _onGeoDrilldown(event: {reportType: KalturaReportType, drillDown: string[]}): void {
    let update: Partial<ExportItem> = { reportType: event.reportType, additionalFilters: {} };

    if (event.drillDown && event.drillDown.length > 0) {
      update.additionalFilters.countryIn = event.drillDown[0];
    }

    if (event.drillDown && event.drillDown.length > 1) {
      update.additionalFilters.regionIn = event.drillDown[1];
    }

    this._exportConfig = EntryExportConfig.updateConfig(this._exportConfigService.getConfig(), 'geo', update);
  }

}
