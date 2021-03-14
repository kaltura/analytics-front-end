import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { Subject } from 'rxjs';
import { analyticsConfig } from "configuration/analytics-config";
import { NavigationDrillDownService } from 'shared/services';
import { OverlayPanel } from "primeng/overlaypanel";

@Component({
  selector: 'app-contributors-top-contributors-table',
  templateUrl: './top-contributors-table.component.html',
  styleUrls: ['./top-contributors-table.component.scss']
})
export class TopContributorsTableComponent implements OnDestroy {
  @Input() set tableData(value: TableRow<string>[]) {
    value = Array.isArray(value) ? value : [];
    this._originalTable = [...value];
    this._tableData = value.slice(0, this._pageSize);
    this._totalCount = value.length;
  }

  @Input() showDivider = false;
  @Input() dates: string;
  @Input() isCompareMode: boolean;
  @Input() columns: string[] = [];
  @Input() firstTimeLoading = true;
  @Input() name = 'default';

  @Output() sortFieldChanged = new EventEmitter<string>();

  @ViewChild('overlay') _overlay: OverlayPanel;

  private _paginationChanged = new Subject<void>();
  private _originalTable: TableRow<string>[] = [];
  private _pageSize = 5;

  public _userId: string;
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  public _pager = new KalturaFilterPager({ pageSize: this._pageSize, pageIndex: 1 });
  public _paginationChanged$ = this._paginationChanged.asObservable();

  constructor(private _logger: KalturaLogger,
              private _navigationDrillDownService: NavigationDrillDownService) {
  }

  ngOnDestroy(): void {
    this._paginationChanged.complete();
  }

  public _onPaginationChanged(event: { page: number, first: number, rows: number, pageCount: number }): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._paginationChanged.next();
      this._logger.trace('Handle pagination changed action by user', { newPage: event.page + 1 });
      this._pager.pageIndex = event.page + 1;
      this._tableData = this._originalTable.slice(event.first, event.first + event.rows);
    }
  }

  public _showOverlay(event: any, userId: string): void {
    if (this._overlay && !analyticsConfig.multiAccount) {
      this._userId = userId;
      this._overlay.show(event);
    }
  }

  public _hideOverlay(): void {
    if (this._overlay && !analyticsConfig.multiAccount) {
      this._userId = null;
        this._overlay.hide();
    }
  }

  public _drillDown(row: TableRow): void {
    if (!row['user_id'] || row['user_id'] === 'Unknown') {
      return; // ignore unknown user drill-down
    }

    this._navigationDrillDownService.drilldown('user', row['user_id'], true, row['partner_id']);
  }
}
