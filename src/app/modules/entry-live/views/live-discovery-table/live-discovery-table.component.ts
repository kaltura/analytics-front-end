import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { KalturaFilterPager, KalturaReportType } from 'kaltura-ngx-client';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { filter } from 'rxjs/operators';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { LiveDiscoverySummaryData, LiveDiscoveryTableData, LiveDiscoveryTableWidget } from './live-discovery-table.widget';
import { liveDiscoveryTablePageSize } from './table-config';
import { TimeSelectorService } from '../live-discovery-chart/time-selector/time-selector.service';
import { liveReportTypeMap } from 'shared/utils/live-report-type-map';
import { ToggleUsersModeService } from '../../components/toggle-users-mode/toggle-users-mode.service';
import { EntryLiveUsersMode } from 'configuration/analytics-config';
import { ViewConfig } from "configuration/view-config";

@Component({
  selector: 'app-live-discovery-table',
  templateUrl: './live-discovery-table.component.html',
  styleUrls: ['./live-discovery-table.component.scss']
})
export class LiveDiscoveryTableComponent implements OnInit, OnDestroy {
  @Input() isPolling: boolean;
  @Input() rangeLabel: string;
  @Input() discoveryViewConfig: ViewConfig;

  @Output() tableChange = new EventEmitter<KalturaReportType>();

  public _isBusy = true;
  public _blockerMessage: AreaBlockerMessage;
  public _tableMode: TableModes;
  public _tableModes = TableModes;
  public _firstTimeLoading = true;
  public _pager = new KalturaFilterPager({ pageSize: liveDiscoveryTablePageSize, pageIndex: 1 });
  public _totalCount = 0;
  public _columns = [];
  public _tableData: TableRow[] = [];
  public _selectedRefineFilters: RefineFilter = null;
  public _order: string;
  public _showTable = false;
  public _summaryData: LiveDiscoverySummaryData;
  public _entryLiveUsersMode = EntryLiveUsersMode;

  constructor(private _errorsManager: ErrorsManagerService,
              private _timeSelector: TimeSelectorService,
              public _usersModeService: ToggleUsersModeService,
              public _widget: LiveDiscoveryTableWidget) {
    _timeSelector.filterLabelChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(label => {
        this.rangeLabel = label;
      });
  }

  ngOnInit() {
    this._widget.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(state => {
        this._isBusy = state.isBusy;
        if (state.error) {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._blockerMessage = null;
              this._widget.retry();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(state.error, actions);
        }
      });

    this._widget.data$
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe((data: LiveDiscoveryTableData) => {
        this._tableMode = data.tableMode;
        this._tableData = data.table.data;
        this._columns = data.table.columns;
        this._totalCount = data.table.totalCount;
        this._summaryData = data.summary;
        this._firstTimeLoading = false;
      });

    this._toggleTable();
  }

  ngOnDestroy(): void {
  }

  public _toggleTable(): void {
    this._showTable = !this._showTable;
    this._widget.toggleTable(this._showTable, this.isPolling);
  }

  public _onTableModeChange(event: TableModes): void {
    this._widget.setTableMode(event);

    const reportType = event === TableModes.users ? liveReportTypeMap(KalturaReportType.entryLevelUsersDiscoveryRealtime) : liveReportTypeMap(KalturaReportType.platformsDiscoveryRealtime);
    this.tableChange.emit(reportType);
  }

  public _openTimeSelector(): void {
    this._timeSelector.openPopup();
  }
}
