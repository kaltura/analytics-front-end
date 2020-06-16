import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { KalturaEntryStatus, KalturaFilterPager } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { EndedService } from './ended.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { ErrorsManagerService, NavigationDrillDownService} from 'shared/services';
import { SortEvent } from 'primeng/api';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { skip } from 'rxjs/operators';

@Component({
  selector: 'app-live-entries-ended',
  templateUrl: './ended.component.html',
  styleUrls: ['./ended.component.scss'],
  providers: [
    EndedService,
  ]
})
export class EndedComponent implements OnInit, OnDestroy {
  @ViewChild('overlay', { static: false }) _overlay: OverlayComponent;

  public _tableData: TableRow[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: 10 });
  public _totalCount = 0;
  public _columns: string[] = [];
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage;
  public _order = '-entry_name';
  public _firstTimeLoading = true;
  public _periodTooltip: string;
  public _entryData: TableRow;
  public _displayLiveStatus = true;
  private timeoutId = null;

  constructor(private _entriesLiveService: EndedService,
              private _errorsManager: ErrorsManagerService,
              private _navigationDrillDownService: NavigationDrillDownService) {
  }

  ngOnInit(): void {
    this._entriesLiveService.startPolling();

    this._periodTooltip = this._getPeriodTooltip();

    this._displayLiveStatus = !analyticsConfig.multiAccount; // hide live status column in multi account view

    this._entriesLiveService.data$
      .pipe(cancelOnDestroy(this), skip(1))
      .subscribe(data => {
        this._columns = data.columns;
        this._tableData = data.table;
        this._totalCount = data.totalCount;
        this._firstTimeLoading = false;
        this._periodTooltip = this._getPeriodTooltip();
      });

    this._entriesLiveService.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        this._isBusy = state.isBusy;

        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._entriesLiveService.restartPolling();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });
  }

  ngOnDestroy(): void {
  }

  private _getPeriodTooltip() {
    const from = moment().subtract(6, 'days').format('MMM DD, YYYY');
    const to = moment().format('MMM DD, YYYY');
    return `${from} - ${to}`;
  }

  public _rowTrackBy(index: number, item: TableRow): string {
    return item['object_id'];
  }


  public _drillDown(entry: TableRow): void {
    const entryId = entry['entry_id'];
    const partnerId = entry['partner_id'];
    this._navigationDrillDownService.drilldown('entry-live', entryId, false, partnerId);
  }

  public _onPaginationChange(event: { page: number, rows: number }): void {
    if (event.page !== (this._pager.pageIndex - 1) || event.rows !== this._pager.pageSize) {
      this._pager.pageIndex = event.page + 1;
      this._pager.pageSize = event.rows;
      this._entriesLiveService.paginationChange(this._pager);
    }
  }

  public _onSortChanged(event: SortEvent): void {
    if (this._firstTimeLoading) { // skip first event
      return;
    }

    if (event.data.length && event.field && event.order) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._entriesLiveService.sortChange(this._order);
      }
    }
  }

  public _showOverlay(event: MouseEvent, entryId: string): void {
    if (this._overlay) {
      this._entryData = this._tableData.find(row => entryId === row['entry_id']);
      if (this.timeoutId === null) {
        this.timeoutId = setTimeout(() => {
          if (this._entryData.status === KalturaEntryStatus.ready) {
            this._overlay.show(event);
            this.timeoutId = null;
          }
        }, 500);
      }
    }
  }

  public _hideOverlay(): void {
    if (this._overlay) {
      this._entryData = null;
      this._overlay.hide();
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }
}
