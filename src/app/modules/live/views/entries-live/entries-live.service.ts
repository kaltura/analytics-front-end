import { Injectable, OnDestroy } from '@angular/core';
import { EntriesLivePollsService } from './entries-live-polls.service';
import { ReportService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { analyticsConfig } from 'configuration/analytics-config';
import { EntriesLiveRequestFactory } from './entries-live-request-factory';
import { BehaviorSubject, Unsubscribable } from 'rxjs';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { KalturaAPIException, KalturaFilterPager, KalturaReportTable } from 'kaltura-ngx-client';
import { EntriesLiveDataConfig } from './entries-live-data.config';
import { ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';

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
  private _partnerId = analyticsConfig.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  private _pollsFactory = new EntriesLiveRequestFactory();
  
  public readonly data$ = this._data.asObservable();
  public readonly state$ = this._state.asObservable();
  
  constructor(private _serverPolls: EntriesLivePollsService,
              private _reportService: ReportService,
              private _dataConfigService: EntriesLiveDataConfig,
              private _frameEventManager: FrameEventManagerService) {
    this._dataConfig = this._dataConfigService.getConfig();
  }
  
  ngOnDestroy(): void {
    this._data.complete();
    this._state.complete();
  }
  
  private _handleTick(table: KalturaReportTable): void {
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
      
      result.table.forEach(item => {
        item['thumbnailUrl'] = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${item['object_id']}/width/256/height/144?rnd=${Math.random()}`;
      });
    }
    
    this._data.next(result);
  
    this._updateHostLayout();
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
      .pipe(cancelOnDestroy(this))
      .subscribe(response => {
        if (response.error) {
          this._state.next({ isBusy: false, error: response.error });
          return;
        }
        
        this._state.next({ isBusy: false });
        this._handleTick(response.result);
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
