import { Injectable, OnDestroy } from '@angular/core';
import { AuthService, ReportService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { analyticsConfig, buildCDNUrl } from 'configuration/analytics-config';
import { BehaviorSubject } from 'rxjs';
import { BaseEntryListAction, KalturaAPIException, KalturaBaseEntryFilter, KalturaBaseEntryListResponse, KalturaClient,
  KalturaDVRStatus, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaLiveStreamAdminEntry, KalturaLiveStreamDetails,
  KalturaMultiRequest, KalturaMultiResponse, KalturaRecordingStatus, KalturaReportResponseOptions, KalturaReportTable,
  KalturaReportType, LiveStreamGetDetailsAction, ReportGetTableAction, ReportGetTableActionArgs, KalturaLiveStreamBroadcastStatus,
  EntryServerNodeListAction, KalturaLiveEntryServerNodeFilter, KalturaLiveEntryServerNode, KalturaEntryServerNodeStatus,
  ConversionProfileAssetParamsListAction, KalturaConversionProfileAssetParamsFilter, KalturaConversionProfileAssetParams,
  KalturaAssetParamsOrigin, BeaconListAction, KalturaBeaconFilter, KalturaBeaconIndexType, KalturaBeacon, KalturaBeaconObjectTypes
} from 'kaltura-ngx-client';
import { BroadcastingEntriesDataConfig } from './broadcasting-entries-data.config';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { ISubscription } from "rxjs/Subscription";
import { TranslateService } from "@ngx-translate/core";
import * as moment from "moment";

export interface BroadcastingEntries {
  id?: string;
  status?: KalturaLiveStreamBroadcastStatus;
  broadcastTime?: moment.Duration;
  currentBroadcastStartTime?: number;
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
  streamHealthClassName?: string;
  redundancy?: boolean;
  conversionProfileId?: number;
  previewUrl?: string;
}

@Injectable()
export class BroadcastingEntriesService implements OnDestroy {
  private readonly _dataConfig: ReportDataConfig;
  private _broadcastingEntries: BroadcastingEntries[] = [];
  private _broadcastingEntriesIDs = '';
  private _data = new BehaviorSubject<{entries: BroadcastingEntries[], update: boolean, forceReload: boolean}>({entries: this._broadcastingEntries, update: false, forceReload: false});
  private _state = new BehaviorSubject<{ isBusy: boolean, error?: KalturaAPIException }>({ isBusy: false });
  private _firstTimeLoading = true;
  private _forceRefresh = false;

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
              private _authService: AuthService,
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

            if (refresh) { // no need to reload entries data if entries returned from the report were not changed
              this._state.next({ isBusy: true }); // show spinner if we need to reload all the data (changed entries returned from report)
              this.loadAdditionalEntriesData();
              this.loadPreviews();
            }

            this.loadStreamDetails();
            this.loadRedundancy();
            this.loadStreamHealth();
          } else {
            this._broadcastingEntries = [];
            this._state.next({ isBusy: false, error: null });
            this._data.next({entries: this._broadcastingEntries, update: false, forceReload: false});
          }
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
    if (this._forceRefresh) {
      refresh = true;
      this._forceRefresh = false;
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
                broadcastingEntry.currentBroadcastStartTime = entry.currentBroadcastStartTime;
                broadcastingEntry.recording = entry.recordingStatus;
                broadcastingEntry.conversionProfileId = entry.conversionProfileId;
              }
            });
            this._data.next({entries: this._broadcastingEntries, update: false, forceReload: this._forceRefresh});
          });
          this._state.next({ isBusy: false, error: null });
          this.loadTranscodingData(); // we load transcoding data after we get entry data since we need the conversionProfileId for each entry. Not using multi-request for better user experience as this data load only once
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
              if (typeof this._broadcastingEntries[index].status !== "undefined" && this._broadcastingEntries[index].status !== streamDetails.broadcastStatus) {
                this._forceRefresh = true; // if stream status change - we must reload all data in order to update playback duration
              }
              this._broadcastingEntries[index].status = streamDetails.broadcastStatus;
            }
          });
          this._data.next({entries: this._broadcastingEntries, update: true, forceReload: this._forceRefresh});
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
          responses.forEach((response, index) => {
            let redundancy = false;
            const entryServerNodes: KalturaLiveEntryServerNode[] = response.result.objects;
            if (entryServerNodes.length > 1) {
              redundancy = entryServerNodes.every(sn => sn.status !== KalturaEntryServerNodeStatus.markedForDeletion);
            }
            this._broadcastingEntries[index].redundancy = redundancy;
          });
          this._data.next({entries: this._broadcastingEntries, update: true, forceReload: this._forceRefresh});
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
          responses.forEach((response, index) => {
            const profiles: KalturaConversionProfileAssetParams[] = response.result.objects;
            const transcoding = !!profiles.find(({ origin }) => origin === KalturaAssetParamsOrigin.convert);
            this._broadcastingEntries[index].transcoding = transcoding;
          });
          this._data.next({entries: this._broadcastingEntries, update: true, forceReload: this._forceRefresh});
        },
        error => {
          console.log("LiveEntries::Error loading entries transcoding: " + error.message);
        });
  }

  private loadStreamHealth(): void {
    let actions = [];
    this._broadcastingEntries.forEach(entry => {
      actions.push(new BeaconListAction({filter: new KalturaBeaconFilter({
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
          responses.forEach((response, index) => {
            const beacons: KalturaBeacon[] = response.result.objects;
            const streamHealth: {health: string, className: string} = this.getStreamHealth(beacons);
            this._broadcastingEntries[index].streamHealth = streamHealth.health;
            this._broadcastingEntries[index].streamHealthClassName = streamHealth.className;
          });
          this._data.next({entries: this._broadcastingEntries, update: true, forceReload: this._forceRefresh});
        },
        error => {
          console.log("LiveEntries::Error loading entries stream health: " + error.message);
        });
  }

  private loadPreviews(): void {
    const pid = this._authService.pid;
    const uiconfId = analyticsConfig.kalturaServer.previewUIConfV7;
    const ks = this._authService.ks;
    const baseUrl = buildCDNUrl('');
    this._broadcastingEntries.forEach(entry => {
      // tslint:disable-next-line:max-line-length
      entry.previewUrl = `${baseUrl}/p/${pid}/embedPlaykitJs/uiconf_id/${uiconfId}/partner_id/${pid}?iframeembed=true&entry_id=${entry.id}&config[provider]={"ks":"${ks}"&config[plugins]={"kava":{"disable":true}}&config[playback]={"autoplay":true,"muted":true}&config[abr]={"capLevelToPlayerSize":true}`;
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

  private getStreamHealth(beacons: KalturaBeacon[]): {health: string, className: string} {
    // find the first primary and first secondary stream (these are the most updated since we ordered by descending updatedAt)
    let primary = null;
    let secondary = null;
    beacons.forEach(beacon => {
      if (primary === null && beacon.eventType[0] === '0' && beacon.privateData) {
        primary = beacon;
      }
      if (secondary === null && beacon.eventType[0] === '1' && beacon.privateData) {
        secondary = beacon;
      }
    });

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

    let key = '';
    let className = '';
    if (primary !== null) {
      className = severityToHealth(JSON.parse(primary.privateData).maxSeverity);
      key = 'primary_' + className;
    } else if (secondary !== null) {
      className = severityToHealth(JSON.parse(secondary.privateData).maxSeverity);
      key = 'secondary_' + className;
    }
    const localizationKey = key.length ? 'app.entriesLive.health.' + key : 'app.common.na';
    return { health: this._translate.instant(localizationKey), className };
  }

  public paginationChange(pager: KalturaFilterPager): void {

  }
}
