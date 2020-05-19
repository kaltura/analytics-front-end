import { Component, OnDestroy, OnInit } from '@angular/core';
import { UpcomingBroadcast, UpcomingService } from "./upcoming.service";
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import { AreaBlockerMessage } from "@kaltura-ng/kaltura-ui";
import { ErrorsManagerService } from "shared/services";
import { KalturaFilterPager } from "kaltura-ngx-client";

@Component({
  selector: 'app-live-entries-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
  providers: [
    UpcomingService,
  ]
})
export class UpcomingComponent implements OnInit, OnDestroy {

  public _firstTimeLoading = true;
  public _blockerMessage: AreaBlockerMessage;
  public _isBusy = false;
  public _tableData: UpcomingBroadcast[] = [];
  public  _totalCount = 0;
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: 10 });

  constructor(private _errorsManager: ErrorsManagerService,
              private _upcomingService: UpcomingService) {
  }

  ngOnInit(): void {
    this._upcomingService.data$
      .pipe(cancelOnDestroy(this))
      .subscribe(data => {
        this._firstTimeLoading = false;
        this._tableData = data.table;
        this._totalCount = data.totalCount;
      });

    this._upcomingService.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        this._isBusy = state.isBusy;

        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._upcomingService.loadEntries();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });

    this._upcomingService.loadEntries();
  }

  public _rowTrackBy(index: number, item: UpcomingBroadcast): string {
    return item.id;
  }

  public _onPaginationChange(event: { page: number, rows: number }): void {
    if (event.page !== (this._pager.pageIndex - 1) || event.rows !== this._pager.pageSize) {
      this._pager.pageIndex = event.page + 1;
      this._pager.pageSize = event.rows;
      this._upcomingService.paginationChange(this._pager);
    }
  }

  ngOnDestroy(): void {
  }
}
