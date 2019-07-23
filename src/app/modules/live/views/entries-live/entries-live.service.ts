import { Injectable, OnDestroy } from '@angular/core';
import { EntriesLivePollsService } from './entries-live-polls.service';
import { ReportHelper, ReportService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { analyticsConfig } from 'configuration/analytics-config';
import { EntriesLiveRequestFactory } from './entries-live-request-factory';
import { BehaviorSubject, of, Unsubscribable } from 'rxjs';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { BaseEntryListAction, KalturaAPIException, KalturaBaseEntryFilter, KalturaClient, KalturaDetachedResponseProfile, KalturaEntryServerNodeStatus, KalturaFilterPager, KalturaLiveStreamEntry, KalturaReportTable, KalturaRequestOptions, KalturaResponseProfileType } from 'kaltura-ngx-client';
import { EntriesLiveDataConfig } from './entries-live-data.config';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { map, switchMap } from 'rxjs/operators';

export interface EntriesLiveData {
  table: TableRow[];
  columns: string[];
  totalCount: number;
}

@Injectable()
export class EntriesLiveService implements OnDestroy {
  private readonly _dataConfig: ReportDataConfig;
  private _data = new BehaviorSubject<EntriesLiveData>({ totalCount: 0, columns: [], table: [] });
  private _state = new BehaviorSubject<{ isBusy: boolean, error?: KalturaAPIException }>({ isBusy: false });
  private _pollingSubscription: Unsubscribable;
  private _pollsFactory = new EntriesLiveRequestFactory();
  private _firstTimeLoading = true;
  
  public readonly data$ = this._data.asObservable();
  public readonly state$ = this._state.asObservable();
  
  constructor(private _serverPolls: EntriesLivePollsService,
              private _reportService: ReportService,
              private _kalturaClient: KalturaClient,
              private _dataConfigService: EntriesLiveDataConfig,
              private _frameEventManager: FrameEventManagerService) {
    this._dataConfig = this._dataConfigService.getConfig();
  }
  
  ngOnDestroy(): void {
    this._data.complete();
    this._state.complete();
  }
  
  private _parseReportData(table: KalturaReportTable): EntriesLiveData {
    const result = {
      totalCount: 0,
      columns: [],
      table: []
    };
    
    if (table && table.header && table.data) {
      const { tableData, columns } = this._reportService.parseTableData(table, this._dataConfig[ReportDataSection.table]);
      result.table = tableData;
      result.columns = columns;
      result.totalCount = table.totalCount;
    }
    
    return result;
  }
  
  private _mapReportData(entries: KalturaLiveStreamEntry[], data: EntriesLiveData): EntriesLiveData {
    data.table.forEach(row => {
      const relevantEntry = entries.find(({ id }) => id === row['entry_id']) as KalturaLiveStreamEntry;
      if (relevantEntry) {
        row['entry_name'] = relevantEntry.name;
        row['thumbnailUrl'] = relevantEntry.thumbnailUrl;
        row['status'] = relevantEntry.status;
        row['liveStatus'] = [KalturaEntryServerNodeStatus.broadcasting, KalturaEntryServerNodeStatus.playable].indexOf(relevantEntry.liveStatus) !== -1; // meaning is live, might change to actual status
        row['type'] = relevantEntry.mediaType;
        row['created_at'] = ReportHelper.format('serverDate', String(+relevantEntry.createdAt));
        row['stream_started'] = relevantEntry.currentBroadcastStartTime;
      }
    });
    data.columns.unshift('entry_name');
    
    return data;
  }
  
  private _updateHostLayout(): void {
    if (analyticsConfig.isHosted) {
      setTimeout(() => {
        this._frameEventManager.publish(FrameEvents.UpdateLayout, { height: document.getElementById('analyticsApp').getBoundingClientRect().height });
      }, 0);
    }
  }
  
  public startPolling(): void {
    this._state.next({ isBusy: true });
    
    this._pollingSubscription = this._serverPolls.register<KalturaReportTable>(
      analyticsConfig.live.pollInterval,
      this._pollsFactory,
    )
      .pipe(
        cancelOnDestroy(this),
        map(response => {
          if (response.error) {
            throw response.error;
          }
          return this._parseReportData(response.result);
        }),
        switchMap(data => {
          if (data.table.length) {
            const idIn = data.table.map(row => row['entry_id']).join(',');
            
            return this._kalturaClient
              .request(
                new BaseEntryListAction({
                  filter: new KalturaBaseEntryFilter({ idIn })
                }).setRequestOptions(
                  new KalturaRequestOptions({
                    responseProfile: new KalturaDetachedResponseProfile({
                      type: KalturaResponseProfileType.includeFields,
                      fields: 'id,name,thumbnailUrl,status,liveStatus,mediaType,createdAt,currentBroadcastStartTime'
                    })
                  })
                )
              )
              .pipe(
                map(response => this._mapReportData(response.objects as KalturaLiveStreamEntry[], data))
              );
          }
          return of(data);
        })
      )
      .subscribe(
        data => {
          this._data.next(data);
          this._state.next({ isBusy: false });
          this._pollsFactory.onPollTickSuccess();

          if (this._firstTimeLoading && data.totalCount) {
            this._updateHostLayout();
          }
  
          this._firstTimeLoading = false;
        },
        error => {
          this._state.next({ isBusy: false, error });
        });
  }
  
  public stopPolling(): void {
    if (this._pollingSubscription) {
      this._pollingSubscription.unsubscribe();
      this._pollingSubscription = null;
    }
  }
  
  public restartPolling(): void {
    this.stopPolling();
    this.startPolling();
  }
  
  public sortChange(order: string): void {
    this._pollsFactory.order = order;
    this.restartPolling();
  }
  
  public paginationChange(pager: KalturaFilterPager): void {
    this._pollsFactory.pager = pager;
    this.restartPolling();
  }
}
