import { Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ISubscription } from 'rxjs/Subscription';
import {
  BaseEntryGetAction, KalturaBaseEntry, KalturaClient,
  KalturaDetachedResponseProfile, KalturaReportInputFilter,
  KalturaReportInterval, KalturaReportType,
  KalturaResponseProfileType
} from "kaltura-ngx-client";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {DateChangeEvent, DateRanges} from "shared/components/date-filter/date-filter.service";
import {RefineFilter} from "shared/components/filter/filter.component";

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

  constructor(private location: Location, private route: ActivatedRoute, private zone: NgZone, private _kalturaClient: KalturaClient) { }

  ngOnInit() {
    this.subscription = this.route.params.subscribe(params => {
      this._entryId = params['id'];
      this.loadEntryDetails();
    });

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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
    const request = new BaseEntryGetAction({ entryId: this._entryId })
      .setRequestOptions({
        responseProfile: new KalturaDetachedResponseProfile({
          type: KalturaResponseProfileType.includeFields,
          fields: 'name'
        })
      });

    this.requestSubscription = this._kalturaClient
      .request(request)
      .pipe(
        cancelOnDestroy(this)
      )
      .subscribe(
        (entry: KalturaBaseEntry) => {
          this._entryName = entry.name;
          this.requestSubscription = null;
        },
        error => {
          console.error("Failed to load entry name: " + error.message);
          this.requestSubscription = null;
        });
  }

  public _back(): void {
    this.location.back();
  }

}
