import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KalturaAPIException, KalturaClient, KalturaDetachedResponseProfile, KalturaFilterPager, KalturaLiveStreamEntryFilter,
  KalturaLiveStreamScheduleEvent, KalturaLiveStreamScheduleEventFilter, KalturaRequestOptions, KalturaResponseProfileType,
  KalturaUserFilter, LiveStreamListAction, ScheduleEventListAction, UserListAction } from 'kaltura-ngx-client';

export interface UpcomingBroadcast {
  id: string;
  partnerId?: string;
  thumbnailUrl?: string;
  name?: string;
  creator?: string;
  startDate: number | Date;
  endDate: number | Date;
}

export interface EntriesLiveData {
  table: UpcomingBroadcast[];
  totalCount: number;
}

@Injectable()
export class UpcomingService implements OnDestroy {
  private _data = new BehaviorSubject<EntriesLiveData>({ totalCount: 0, table: [] });
  private _state = new BehaviorSubject<{ isBusy: boolean, error?: KalturaAPIException }>({ isBusy: false });
  private _pager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });
  private _entries: UpcomingBroadcast[] = [];
  private _totalCount = 0;
  private _orderBy = '+startDate';

  public readonly data$ = this._data.asObservable();
  public readonly state$ = this._state.asObservable();

  constructor(private _kalturaClient: KalturaClient) {
  }

  public loadScheduledEvents(): void {
    this._state.next({ isBusy: true });
    this._kalturaClient
      .request(
        new ScheduleEventListAction({
          filter: new KalturaLiveStreamScheduleEventFilter({ startDateGreaterThanOrEqual: new Date(), orderBy: this._orderBy}),
          pager: this._pager
        }).setRequestOptions(
          new KalturaRequestOptions({
            responseProfile: new KalturaDetachedResponseProfile({
              type: KalturaResponseProfileType.includeFields,
              fields: 'templateEntryId,startDate,endDate'
            })
          })
        )
      )
      .subscribe(result => {
          this._totalCount = result.totalCount;
          this._entries = [];
          let entryIDs = '';
          result.objects.forEach((event: KalturaLiveStreamScheduleEvent, index) => {
            this._entries.push({
              id: event.templateEntryId,
              startDate: event.startDate ? event.startDate : 0,
              endDate: event.endDate ? event.endDate : 0
            });
            entryIDs += event.templateEntryId;
            if (index < result.objects.length - 1) {
              entryIDs += ',';
            }
          });
          if (this._totalCount > 0) {
            this.loadEntries(entryIDs);
          } else {
            this._data.next({table: [], totalCount: 0});
            this._state.next({ isBusy: false });
          }
        },
        error => {
          this._state.next({ isBusy: false, error });
        });
  }

  private loadEntries(idIn: string): void {
    this._kalturaClient
      .request(
        new LiveStreamListAction({
          filter: new KalturaLiveStreamEntryFilter({ idIn }),
          pager: this._pager
        }).setRequestOptions(
          new KalturaRequestOptions({
            responseProfile: new KalturaDetachedResponseProfile({
              type: KalturaResponseProfileType.includeFields,
              fields: 'id,name,thumbnailUrl,startDate,endDate,creatorId,userId,partnerId'
            })
          })
        )
      )
      .subscribe(result => {
          result.objects.forEach(entry => {
            this._entries.forEach(scheduledEntry => {
              if (scheduledEntry.id === entry.id) {
                scheduledEntry.thumbnailUrl = entry.thumbnailUrl;
                scheduledEntry.name = entry.name;
                scheduledEntry.creator = entry.creatorId ? entry.creatorId : entry.userId ? entry.userId : '';
                scheduledEntry.partnerId = entry.partnerId.toString();
              }
            });
          });
          this.loadCreators();
        },
        error => {
          this._state.next({ isBusy: false, error });
        });
  }

  private loadCreators(): void {
    let IDs = '';
    this._entries.forEach((entry, index) => {
      if (entry.creator.length) {
        IDs += entry.creator;
        if (index < this._entries.length - 1) {
          IDs += ',';
        }
      }
    });
    if (IDs.length) {
      this._kalturaClient
        .request(
          new UserListAction({
            filter: new KalturaUserFilter({ idIn: IDs })
          }).setRequestOptions(
            new KalturaRequestOptions({
              responseProfile: new KalturaDetachedResponseProfile({
                type: KalturaResponseProfileType.includeFields,
                fields: 'id,fullName'
              })
            })
          )
        )
        .subscribe(result => {
            result.objects.forEach(user => {
              this._entries.forEach(entry => {
                if (entry.creator === user.id) {
                  entry.creator = user.fullName;
                }
              });
            });
            this._state.next({ isBusy: false });
            this._data.next({table: this._entries, totalCount: this._totalCount});
          },
          error => {
            this._state.next({ isBusy: false });
            this._data.next({table: this._entries, totalCount: this._totalCount});
          });
    } else {
      this._state.next({ isBusy: false });
      this._data.next({table: this._entries, totalCount: this._totalCount});
    }
  }

  ngOnDestroy(): void {
    this._data.complete();
    this._state.complete();
  }

  public paginationChange(pager: KalturaFilterPager): void {
    this._pager = pager;
    this.loadScheduledEvents();
  }

  public sortOrderChange(order: string): void {
    if (order !== this._orderBy) {
      this._orderBy = order;
      this.loadScheduledEvents();
    }
  }

}
