import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ISubscription } from 'rxjs/Subscription';
import {
  BaseEntryGetAction,
  KalturaBaseEntry,
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
  KalturaResponseProfileType, KalturaUser,
  UserGetAction
} from "kaltura-ngx-client";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {DateChangeEvent, DateRanges} from "shared/components/date-filter/date-filter.service";
import {RefineFilter} from "shared/components/filter/filter.component";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import { analyticsConfig } from 'configuration/analytics-config';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-entry',
  templateUrl: './entry-view.component.html',
  styleUrls: ['./entry-view.component.scss']
})
export class EntryViewComponent implements OnInit, OnDestroy {

  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _csvExportHeaders = '';
  public _totalCount: number;
  public _reportType: KalturaReportType = KalturaReportType.userUsage;
  public _selectedMetrics: string;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  private requestSubscription: ISubscription;
  private subscription: ISubscription;


  public _entryId = '';
  public _entryName = '';
  public _entryType: KalturaMediaType = null;
  public _owner = '';

  constructor(private _router: Router,
              private route: ActivatedRoute,
              private zone: NgZone,
              private _kalturaClient: KalturaClient,
              private _frameEventManager: FrameEventManagerService) { }

  ngOnInit() {
    if (analyticsConfig.isHosted) {
      this._frameEventManager
        .listen(FrameEvents.UpdateFilters)
        .pipe(cancelOnDestroy(this), filter(Boolean))
        .subscribe(({ queryParams }) => {
          this._entryId = queryParams['id'];
          if (this._entryId) {
            this.loadEntryDetails();
          }
        });
    } else {
      this.subscription = this.route.params.subscribe(params => {
        this._entryId = params['id'];
        if (this._entryId) {
          this.loadEntryDetails();
        }
      });
    }

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
    const request = new KalturaMultiRequest(
      new BaseEntryGetAction({ entryId: this._entryId })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'name,mediaType'
          })
        }),
      new UserGetAction({ userId: null })
        .setRequestOptions(
          new KalturaRequestOptions({
            responseProfile: new KalturaDetachedResponseProfile({
              type: KalturaResponseProfileType.includeFields,
              fields: 'id,fullName'
            })
          }).setDependency(['userId', 0, 'userId'])
        )
    );

    this.requestSubscription = this._kalturaClient
      .multiRequest(request)
      .pipe(
        cancelOnDestroy(this),
        map((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            throw Error(responses.reduce((acc, val) => `${acc}\n${val.error ? val.error.message : ''}`, ''));
          }
  
          return [responses[0].result, responses[1].result] as [KalturaMediaEntry, KalturaUser];
        })
      )
      .subscribe(
        ([entry, user]) => {
          this._entryName = entry.name;
          this._entryType = entry.mediaType;
          this._owner = user.fullName;
          this.requestSubscription = null;
        },
        error => {
          console.error("Failed to load entry name: " + error.message);
          this.requestSubscription = null;
        });
  }

  public _back(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.EntryNavigateBack);
    } else {
      this._router.navigateByUrl('/audience/engagement');
    }
  }

  public _navigateToEntry(): void {
    this._frameEventManager.publish(FrameEvents.NavigateTo, '/content/entries/entry/' + this._entryId);
  }

}
