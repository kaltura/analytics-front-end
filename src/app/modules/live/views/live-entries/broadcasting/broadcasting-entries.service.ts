import { Injectable, OnDestroy } from '@angular/core';
import { ReportService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { analyticsConfig } from 'configuration/analytics-config';
import { BehaviorSubject } from 'rxjs';
import { BaseEntryListAction, KalturaAPIException, KalturaBaseEntryListResponse, KalturaClient,
  KalturaDVRStatus, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaLiveStreamAdminEntry, KalturaLiveStreamDetails,
  KalturaMultiRequest, KalturaMultiResponse, KalturaRecordingStatus, KalturaReportResponseOptions, KalturaReportTable,
  KalturaReportType, LiveStreamGetDetailsAction, ReportGetTableAction, ReportGetTableActionArgs, KalturaLiveStreamBroadcastStatus,
  EntryServerNodeListAction, KalturaLiveEntryServerNodeFilter, KalturaLiveEntryServerNode, KalturaEntryServerNodeStatus,
  ConversionProfileAssetParamsListAction, KalturaConversionProfileAssetParamsFilter, KalturaConversionProfileAssetParams,
  KalturaAssetParamsOrigin, BeaconListAction, KalturaBeaconFilter, KalturaBeaconIndexType, KalturaBeacon, KalturaBeaconObjectTypes,KalturaRecordStatus,KalturaLiveEntryFilter, KalturaBaseEntry, UserListAction, KalturaUserFilter,
} from 'kaltura-ngx-client';
import { BroadcastingEntriesDataConfig } from './broadcasting-entries-data.config';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { ISubscription } from "rxjs/Subscription";
import { TranslateService } from "@ngx-translate/core";
import * as moment from "moment";
import { map } from "rxjs/operators";
import { KalturaLiveEntryFilterArgs } from "kaltura-ngx-client/lib/api/types/KalturaLiveEntryFilter";

export interface BroadcastingEntries {
  id?: string;
  status?: KalturaLiveStreamBroadcastStatus;
  broadcastTime?: moment.Duration;
  currentBroadcastStartTime?: number;
  name?: string;
  owner?: string;
  dvr?: KalturaDVRStatus;
  recording?: boolean;
  transcoding?: boolean;
  activeUsers?: number;
  engagedUsers?: number;
  buffering?: number;
  downstream?: number;
  primaryStreamHealth?: string;
  primaryStreamHealthClassName?: string;
  primaryLastUpdate?: Date;
  secondaryStreamHealth?: string;
  secondaryStreamHealthClassName?: string;
  secondaryLastUpdate?: Date;
  redundancy?: boolean;
  conversionProfileId?: number;
  partnerId?: string;
  thumbnailUrl?: string;
}

@Injectable()
export class BroadcastingEntriesService implements OnDestroy {
  private readonly _dataConfig: ReportDataConfig;
  private _broadcastingEntries: BroadcastingEntries[] = [];
  private _fetchedUsers: Record<string, string> = {};
  private _data = new BehaviorSubject<{entries: BroadcastingEntries[], totalCount: number, update: boolean, forceReload: boolean}>({entries: this._broadcastingEntries, totalCount: 0, update: false, forceReload: false});
  private _state = new BehaviorSubject<{ isBusy: boolean, error?: KalturaAPIException, forceRefresh?: boolean }>({ isBusy: false });
  private _firstTimeLoading = true;
  private _forceRefresh = false;
  private _totalCount = 0;
  private _pageIndex = 1;
  private _pageSize = 5;

  private reportSubscription: ISubscription = null;
  private baseEntryListSubscription: ISubscription = null;
  private streamDetailsSubscription: ISubscription = null;
  private entryServerNodeSubscription: ISubscription = null;
  private conversionProfilesSubscription: ISubscription = null;
  private streamHealthSubscription: ISubscription = null;

  public readonly data$ = this._data.asObservable();
  public readonly state$ = this._state.asObservable();

  constructor(private _reportService: ReportService,
              private _kalturaClient: KalturaClient,
              private _translate: TranslateService,
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
      reportType: reportTypeMap(KalturaReportType.topLiveNowEntries),
      reportInputFilter: new KalturaEndUserReportInputFilter({
        timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
        toDate: moment().subtract(30, 'seconds').unix(),
        fromDate: moment().subtract(40, 'seconds').unix()
      }),
      pager: new KalturaFilterPager({ pageSize: 5, pageIndex: this._pageIndex }),
      order: '-entry_name',
      responseOptions: new KalturaReportResponseOptions({
        delimiter: analyticsConfig.valueSeparator,
        skipEmptyDates: analyticsConfig.skipEmptyBuckets
      })
    };

    const baseEntryArgs: KalturaLiveEntryFilterArgs = {
      isLive: 1,
    }

    const request = new KalturaMultiRequest(
        new ReportGetTableAction(tableActionArgs),
        new BaseEntryListAction({
              filter: new KalturaLiveEntryFilter(baseEntryArgs),
              pager: new KalturaFilterPager({ pageSize: 500, pageIndex: 1 })},
    ));

    this.reportSubscription = this._kalturaClient.multiRequest(request)
      .pipe(cancelOnDestroy(this),
      map((responses: KalturaMultiResponse) => {
      if (responses.hasErrors()) {
        const err: KalturaAPIException = responses.getFirstError();
        throw err;
      }
      return [
        responses[0].result,
        responses[1].result
      ] as [KalturaReportTable, KalturaBaseEntryListResponse];
    }))
      .subscribe(([table, entries]) => {
          let refresh = true;
          this._totalCount = 0;
          const entryListResponse: KalturaBaseEntry[] = entries.objects || null;

          if ((table && table.header && table.data) || (entryListResponse && entryListResponse.length > 0)) {
            const { tableData, columns } = this._reportService.parseTableData(table, this._dataConfig[ReportDataSection.table]);
            const mappedIds = tableData.map(entry => entry.entry_id);

            const missingItemsFromTable = tableData.length === 0
                ? entryListResponse.map(({ id, creatorId }) => ({ entry_id: id, creator_id: creatorId  }))
                : entryListResponse
                    .filter(entry => !mappedIds.includes(entry.id))
                    .map(entry => ({ entry_id: entry.id, creator_id: entry.creatorId }));

            const mergedData = [...tableData, ...missingItemsFromTable];

            this._totalCount = mergedData.length;

            const start = (this._pageIndex - 1) * this._pageSize;
            const endIndex = Math.min(start + this._pageSize, mergedData.length);

            const slicedData = mergedData.slice(start, endIndex);

            refresh = this.shouldRefreshEntries(mergedData);
            this.mapReportResultToEntries(slicedData, refresh);

            if (refresh) { // no need to reload entries data if entries returned from the report were not changed
              this._state.next({ isBusy: true }); // show spinner if we need to reload all the data (changed entries returned from report)
              const idIn = entryListResponse.map(entry => entry.creatorId).join(',');
              this._kalturaClient.request(new UserListAction({filter: new KalturaUserFilter({ idIn: idIn })}))
                  .pipe(
                      cancelOnDestroy(this),
                      map((result) => {
                        const users = (result.objects || []).reduce((acc, user) => {
                          acc[user.id] = `${user.firstName} ${user.lastName}`;
                          return acc;
                        }, {} as Record<string, string>);
                        this._fetchedUsers = users;
                        return { table, entries };
                      })
                  )
                  .subscribe(result => {
                        mergedData.forEach((entry, index) => {
                              this._broadcastingEntries.forEach((broadCastingEntry) => {
                                if(!broadCastingEntry.owner){
                                  broadCastingEntry.owner = this._fetchedUsers[entry.creator_id];
                                }
                              });
                            },
                            error => {
                              this._state.next({ isBusy: false });
                              this._data.next({entries: this._broadcastingEntries, totalCount: this._totalCount, update: false, forceReload: false});
                            });
                        this.loadAdditionalEntriesData(entryListResponse);
                      }
                  );
            }
            else {
              this._state.next({ isBusy: false });
            }

            this.loadStreamDetails();
            this.loadRedundancy();
            this.loadStreamHealth();
          } else {
            if (this._pageIndex > 1 && this._totalCount > 0) {
              // No entries on this page but there are entries on previous pages
              this.paginationChange(Math.ceil(this._totalCount / this._pageSize), false);
              this._state.next({ isBusy: false, error: null, forceRefresh: true });
            } else {
              // No entries at all
              this._broadcastingEntries = [];
              this._totalCount = 0;
              this._state.next({ isBusy: false, error: null });
              this._data.next({entries: this._broadcastingEntries, totalCount: this._totalCount, update: false, forceReload: false});
            }
          }
        },
        error => {
          this._state.next({ isBusy: false, error });
        });
  }

  private mapReportResultToEntries(entries: any[], refresh: boolean): void {
    // When refreshing, create a new array of broadcasting entries
    if (refresh) {
      this._broadcastingEntries = [];
      entries.forEach((entry) => {
        // For each entry in the current page, create a BroadcastingEntry object
        this._broadcastingEntries.push({
          id: entry.entry_id,
          activeUsers: entry.views ?? 0,
          owner: entry.creator_name ?? this._fetchedUsers[entry.creator_id],
          engagedUsers: entry.avg_view_engagement ?? 0,
          buffering: entry.avg_view_buffering ?? 0,
          downstream: entry.avg_view_downstream_bandwidth ?? 0
        });
      });
    } else {
      entries.forEach((entry) => {
        this._broadcastingEntries.forEach(broadcastingEntry => {
          if (broadcastingEntry.id === entry.entry_id) {
            broadcastingEntry.activeUsers = entry.views ?? 0;
            broadcastingEntry.engagedUsers = entry.avg_view_engagement ?? 0;
            broadcastingEntry.buffering = entry.avg_view_buffering ?? 0;
            broadcastingEntry.downstream = entry.avg_view_downstream_bandwidth ?? 0;
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
      refresh = false;
      entries.forEach(entry => {
        let idFound = false;
        this._broadcastingEntries.forEach(broadcastingEntry => {
          if (entry.entry_id === broadcastingEntry.id) {
            idFound = true;
          }
        });
        if (!idFound) {
          refresh = true;
        }
      });
    }
    if (this._forceRefresh) {
      refresh = true;
      this._forceRefresh = false;
    }
    return refresh;
  }

  private loadAdditionalEntriesData(entries: KalturaBaseEntry[]): void {
    const relevantEntries = entries.filter(entry =>
      this._broadcastingEntries.some(broadcastingEntry => broadcastingEntry.id === entry.id)
    );

    relevantEntries.forEach((entry: KalturaLiveStreamAdminEntry) => {
      this._broadcastingEntries.forEach((broadcastingEntry: BroadcastingEntries) => {
        if (broadcastingEntry.id === entry.id) {
          broadcastingEntry.name = entry.name;
          broadcastingEntry.dvr = entry.dvrStatus;
          broadcastingEntry.thumbnailUrl = entry.thumbnailUrl;
          broadcastingEntry.currentBroadcastStartTime = entry.currentBroadcastStartTime;
          broadcastingEntry.recording = entry.recordingStatus === KalturaRecordingStatus.active && entry.recordStatus !== KalturaRecordStatus.disabled;
          broadcastingEntry.conversionProfileId = entry.conversionProfileId;
          broadcastingEntry.partnerId = entry.partnerId.toString();
        }
      });
    });

    this._data.next({entries: this._broadcastingEntries, totalCount: this._totalCount, update: false, forceReload: this._forceRefresh});
    this._state.next({ isBusy: false, error: null });
    this.loadTranscodingData();
  }

  private loadStreamDetails(): void {
    let actions = [];
    this._broadcastingEntries.forEach(entry => {
      actions.push(new LiveStreamGetDetailsAction({id: entry.id}));
    });
    this.streamDetailsSubscription = this._kalturaClient.multiRequest(new KalturaMultiRequest(...actions))
      .pipe(cancelOnDestroy(this))
      .subscribe((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            console.error("LiveEntries::Error loading entries streamDetails: " + responses.getFirstError().message) ;
          }
          responses.forEach((response, index) => {
            const streamDetails: KalturaLiveStreamDetails = response.result;
            if (streamDetails && streamDetails.broadcastStatus) {
              if (typeof this._broadcastingEntries[index].status !== "undefined" && this._broadcastingEntries[index].status !== streamDetails.broadcastStatus) {
                this._forceRefresh = true; // if stream status change - we must reload all data in order to update playback duration
              }
              this._broadcastingEntries[index].status = streamDetails.broadcastStatus;
            }
          });
          this._data.next({entries: this._broadcastingEntries, totalCount: this._totalCount, update: true, forceReload: this._forceRefresh});
        },
        error => {
          console.log("LiveEntries::Error loading entries streamDetails: " + error.message);
        });
  }

  private loadRedundancy(): void {
    let actions = [];
    this._broadcastingEntries.forEach(entry => {
      actions.push(new EntryServerNodeListAction({filter: new KalturaLiveEntryServerNodeFilter({ entryIdEqual: entry.id })}));
    });
    this.entryServerNodeSubscription = this._kalturaClient.multiRequest(new KalturaMultiRequest(...actions))
      .pipe(cancelOnDestroy(this))
      .subscribe((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            console.error("LiveEntries::Error loading entries redundancy: " + responses.getFirstError().message) ;
          }
          responses.forEach((response, index) => {
            let redundancy = false;
            const entryServerNodes: KalturaLiveEntryServerNode[] = response.result ? response.result.objects : [];
            if (entryServerNodes.length > 1) {
              redundancy = entryServerNodes.every(sn => sn.status !== KalturaEntryServerNodeStatus.markedForDeletion);
            }
            this._broadcastingEntries[index].redundancy = redundancy;
          });
          this._data.next({entries: this._broadcastingEntries, totalCount: this._totalCount, update: true, forceReload: this._forceRefresh});
        },
        error => {
          console.log("LiveEntries::Error loading entries redundancy: " + error.message);
        });
  }

  private loadTranscodingData(): void {
    let actions = [];
    this._broadcastingEntries.forEach(entry => {
      actions.push(new ConversionProfileAssetParamsListAction({filter: new KalturaConversionProfileAssetParamsFilter({ conversionProfileIdEqual: entry.conversionProfileId })}));
    });
    this.conversionProfilesSubscription = this._kalturaClient.multiRequest(new KalturaMultiRequest(...actions))
      .pipe(cancelOnDestroy(this))
      .subscribe((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            console.error("LiveEntries::Error loading entries transcoding: " + responses.getFirstError().message) ;
          }
          responses.forEach((response, index) => {
            const profiles: KalturaConversionProfileAssetParams[] = response.result.objects;
            const transcoding = !!profiles.find(({ origin }) => origin === KalturaAssetParamsOrigin.convert);
            this._broadcastingEntries[index].transcoding = transcoding;
          });
          this._data.next({entries: this._broadcastingEntries, totalCount: this._totalCount, update: true, forceReload: this._forceRefresh});
        },
        error => {
          console.log("LiveEntries::Error loading entries transcoding: " + error.message);
        });
  }

  private loadStreamHealth(): void {
    let actions = [];
    this._broadcastingEntries.forEach(entry => {
      actions.push(new BeaconListAction({
        pager: new KalturaFilterPager({
          pageSize: 100,
          pageIndex: 1
        }),
        filter: new KalturaBeaconFilter({
          orderBy: '-updatedAt',
          relatedObjectTypeIn: KalturaBeaconObjectTypes.entryBeacon,
          eventTypeIn: '0_healthData,1_healthData',
          objectIdIn: entry.id,
          indexTypeEqual: KalturaBeaconIndexType.log
        })}));
    });
    this.streamHealthSubscription = this._kalturaClient.multiRequest(new KalturaMultiRequest(...actions))
      .pipe(cancelOnDestroy(this))
      .subscribe((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            console.error("LiveEntries::Error loading entries stream health: " + responses.getFirstError().message) ;
          }
          responses.forEach((response, index) => {
            const beacons: KalturaBeacon[] = response.result.objects;
            const streamHealth: {health: string, className: string, updatedAt: Date}[] = this.getStreamHealth(beacons);
            this._broadcastingEntries[index].primaryStreamHealth = streamHealth.length ? streamHealth[0].health : null;
            this._broadcastingEntries[index].primaryStreamHealthClassName = streamHealth.length ? streamHealth[0].className : null;
            this._broadcastingEntries[index].primaryLastUpdate = streamHealth.length ? streamHealth[0].updatedAt : null;
            this._broadcastingEntries[index].secondaryStreamHealth = streamHealth.length === 2 ? streamHealth[1].health : null;
            this._broadcastingEntries[index].secondaryStreamHealthClassName = streamHealth.length === 2 ? streamHealth[1].className : null;
            this._broadcastingEntries[index].secondaryLastUpdate = streamHealth.length === 2 ? streamHealth[1].updatedAt : null;
          });
          this._data.next({entries: this._broadcastingEntries, totalCount: this._totalCount, update: true, forceReload: this._forceRefresh});
        },
        error => {
          console.log("LiveEntries::Error loading entries stream health: " + error.message);
        });
  }

  private clearAllSubscriptions(): void {
    const subscriptions = [this.reportSubscription, this.baseEntryListSubscription, this.streamDetailsSubscription,
      this.entryServerNodeSubscription, this.conversionProfilesSubscription, this.streamHealthSubscription];

    subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    });
  }

  private getStreamHealth(beacons: KalturaBeacon[]): {health: string, className: string, updatedAt: Date}[] {
    let streamHealth = [];
    // find the first primary and first secondary stream (these are the most updated since we ordered by descending updatedAt)
    let primary = null;
    let secondary = null;
    for (let i = 0; i< beacons.length; i++) {
      const beacon = beacons[i];
      if (primary === null && beacon.eventType[0] === '0' && beacon.privateData) {
        primary = beacon;
      }
      if (secondary === null && beacon.eventType[0] === '1' && beacon.privateData) {
        secondary = beacon;
      }
      if (primary && secondary) {
        break;
      }
    }

    const severityToHealth = (severity: number) => {
      let health = '';
      if (severity === 0 || severity === 1) {
        health = 'good';
      } else if (severity === 2) {
        health = 'fair';
      } else if (severity === 3 || severity === 4) {
        health = 'poor';
      }
      return health;
    };

    if (primary !== null) {
      const primaryClassName = severityToHealth(JSON.parse(primary.privateData).maxSeverity);
      const primaryKey = 'primary_' + primaryClassName;
      streamHealth.push({ health: this._translate.instant(`app.entriesLive.health.${primaryKey}`), className: primaryClassName, updatedAt: primary.updatedAt });
    }
    if (secondary !== null) {
      const secondaryClassName = severityToHealth(JSON.parse(secondary.privateData).maxSeverity);
      const secondaryKey = 'secondary_' + secondaryClassName;
      streamHealth.push({ health: this._translate.instant(`app.entriesLive.health.${secondaryKey}`), className: secondaryClassName, updatedAt: secondary.updatedAt });
    }
    return streamHealth;
  }

  public paginationChange(newPageIndex: number, firstTime = true): void {
    this._firstTimeLoading = firstTime;
    this._pageIndex = newPageIndex;
  }
}
