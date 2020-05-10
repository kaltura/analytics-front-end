import { Injectable, OnDestroy } from '@angular/core';
import { ReportService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { analyticsConfig } from 'configuration/analytics-config';
import { BehaviorSubject } from 'rxjs';
import {
  BaseEntryListAction,
  KalturaAPIException,
  KalturaBaseEntryFilter, KalturaBaseEntryListResponse,
  KalturaClient,
  KalturaDVRStatus, KalturaEndUserReportInputFilter,
  KalturaFilterPager, KalturaLiveStreamAdminEntry, KalturaLiveStreamDetails, KalturaMultiRequest, KalturaMultiResponse,
  KalturaRecordingStatus, KalturaReportResponseOptions,
  KalturaReportTable, KalturaReportType, LiveStreamGetDetailsAction,
  ReportGetTableAction,
  ReportGetTableActionArgs,
  KalturaLiveStreamBroadcastStatus
} from 'kaltura-ngx-client';
import { BroadcastingEntriesDataConfig } from './broadcasting-entries-data.config';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from "moment";
import { ISubscription } from "rxjs/Subscription";

export interface BroadcastingEntries {
  id?: string;
  status?: KalturaLiveStreamBroadcastStatus;
  broadcastTime?: string;
  name?: string;
  owner?: string;
  dvr?: KalturaDVRStatus;
  recording?: KalturaRecordingStatus;
  transcoding?: boolean;
  activeUsers?: number;
  engagedUsers?: number;
  buffering?: number;
  downstream?: number;
  streamHealth?: string;
  streamHealthColor?: number;
  redundancy?: boolean;
}

@Injectable()
export class BroadcastingEntriesService implements OnDestroy {
  private readonly _dataConfig: ReportDataConfig;
  private _broadcastingEntries: BroadcastingEntries[] = [];
  private _broadcastingEntriesIDs = '';
  private _data = new BehaviorSubject<{entries: BroadcastingEntries[], update: boolean}>({entries: this._broadcastingEntries, update: false});
  private _state = new BehaviorSubject<{ isBusy: boolean, error?: KalturaAPIException }>({ isBusy: false });
  private _firstTimeLoading = true;

  private reportSubscription: ISubscription = null;
  private baseEntryListSubscription: ISubscription = null;
  private streamDetailsSubscription: ISubscription = null;

  public readonly data$ = this._data.asObservable();
  public readonly state$ = this._state.asObservable();

  constructor(private _reportService: ReportService,
              private _kalturaClient: KalturaClient,
              private _dataConfigService: BroadcastingEntriesDataConfig) {
    this._dataConfig = this._dataConfigService.getConfig();
  }

  ngOnDestroy(): void {
    this._data.complete();
    this._state.complete();
  }

  public loadData(): void {
    this.clearAllSubscriptions(); // cancel any subscription that were not resolved yet
    // only display spinner the first time we load data
    if (this._firstTimeLoading) {
      this._state.next({ isBusy: true });
      this._firstTimeLoading = false;
    }
    // load report
    const tableActionArgs: ReportGetTableActionArgs = {
      reportType: reportTypeMap(KalturaReportType.contentRealtime),
      reportInputFilter: new KalturaEndUserReportInputFilter({
        timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
        toDate: moment().unix(),
        fromDate: moment().subtract(6, 'days').unix()
      }),
      pager: new KalturaFilterPager({ pageSize: 5, pageIndex: 1 }),
      order: '-entry_name',
      responseOptions: new KalturaReportResponseOptions({
        delimiter: analyticsConfig.valueSeparator,
        skipEmptyDates: analyticsConfig.skipEmptyBuckets
      })
    };
    this.reportSubscription = this._kalturaClient.request(new ReportGetTableAction(tableActionArgs))
      .pipe(cancelOnDestroy(this))
      .subscribe((table: KalturaReportTable) => {
          let refresh = true;
          if (table && table.header && table.data) {
            const { tableData, columns } = this._reportService.parseTableData(table, this._dataConfig[ReportDataSection.table]);
            refresh = this.shouldRefreshEntries(tableData);
            this.mapReportResultToEntries(tableData, refresh);
          }
          if (refresh) { // no need to reload entries data if entries returned from the report were not changed
            this._state.next({ isBusy: true }); // show spinner if we need to reload all the data (changed entries returned from report)
            this.loadAdditionalEntriesData();
            // this.loadPreviews();
          }

          this.loadStreamDetails();
          // this.loadTranscoding();
          // this.loadRedundancy();
          // this.loadStreamHealth();

        },
        error => {
          this._state.next({ isBusy: false, error });
        });
  }

  private mapReportResultToEntries(entries: any[], refresh: boolean): void {
    if (refresh) {
      this._broadcastingEntries = [];
      this._broadcastingEntriesIDs = '';
      entries.forEach((entry, index) => {
        this._broadcastingEntries.push({
          id: entry.entry_id,
          activeUsers: entry.view_unique_audience,
          engagedUsers: entry.avg_view_engagement,
          buffering: entry.avg_view_buffering,
          downstream: entry.avg_view_downstream_bandwidth
        });
        this._broadcastingEntriesIDs += entry.entry_id;
        if (index < entries.length - 1) {
          this._broadcastingEntriesIDs += ',';
        }
      });
    } else {
      entries.forEach((entry, index) => {
        this._broadcastingEntries.forEach(broadcastingEntry => {
          if (broadcastingEntry.id === entry.entry_id) {
            broadcastingEntry.activeUsers = entry.view_unique_audience;
            broadcastingEntry.engagedUsers = entry.avg_view_engagement;
            broadcastingEntry.buffering = entry.avg_view_buffering;
            broadcastingEntry.downstream = entry.avg_view_downstream_bandwidth;
          }
        });
      });
    }
  }

  // function to check if we got the same entries in the report or not. If not - return true (should refresh entries)
  private shouldRefreshEntries(entries: any[]): boolean {
    let refresh = false;
    if (entries.length !== this._broadcastingEntries.length) {
      refresh = true;
    } else {
      entries.forEach(entry => {
        refresh = true;
        this._broadcastingEntries.forEach(broadcastingEntry => {
          if (entry.entry_id === broadcastingEntry.id) {
            refresh = false;
          }
        });
      });
    }
    return refresh;
  }

  private loadAdditionalEntriesData(): void {
    const filter = new KalturaBaseEntryFilter({ idIn: this._broadcastingEntriesIDs });
    this.baseEntryListSubscription = this._kalturaClient.request(new BaseEntryListAction({filter}))
      .pipe(cancelOnDestroy(this))
      .subscribe((entries: KalturaBaseEntryListResponse) => {
          entries.objects.forEach((entry: KalturaLiveStreamAdminEntry) => {
            this._broadcastingEntries.forEach((broadcastingEntry: BroadcastingEntries) => {
              if (broadcastingEntry.id === entry.id) {
                broadcastingEntry.name = entry.name;
                broadcastingEntry.owner = entry.userId;
                broadcastingEntry.dvr = entry.dvrStatus;
                broadcastingEntry.recording = entry.recordingStatus;
              }
            });
            this._data.next({entries: this._broadcastingEntries, update: false});
          });
          this._state.next({ isBusy: false, error: null });

        },
        error => {
          console.log("LiveEntries::Error loading additional entries data: " + error.message);
        });
  }

  private loadStreamDetails(): void {
    let actions = [];
    this._broadcastingEntries.forEach(entry => {
      actions.push(new LiveStreamGetDetailsAction({id: entry.id}));
    });
    this.streamDetailsSubscription = this._kalturaClient.multiRequest(new KalturaMultiRequest(...actions))
      .pipe(cancelOnDestroy(this))
      .subscribe((responses: KalturaMultiResponse) => {
          responses.forEach((response, index) => {
            const streamDetails: KalturaLiveStreamDetails = response.result;
            if (streamDetails && streamDetails.broadcastStatus) {
              this._broadcastingEntries[index].status = streamDetails.broadcastStatus;
            }
          });
          this._data.next({entries: this._broadcastingEntries, update: true});
        },
        error => {
          console.log("LiveEntries::Error loading entries streamDetails: " + error.message);
        });
  }

  private clearAllSubscriptions(): void {
    if (this.reportSubscription) {
      this.reportSubscription.unsubscribe();
      this.reportSubscription = null;
    }
    if (this.baseEntryListSubscription) {
      this.baseEntryListSubscription.unsubscribe();
      this.baseEntryListSubscription = null;
    }
    if (this.streamDetailsSubscription) {
      this.streamDetailsSubscription.unsubscribe();
      this.streamDetailsSubscription = null;
    }
  }

  public paginationChange(pager: KalturaFilterPager): void {

  }
}
