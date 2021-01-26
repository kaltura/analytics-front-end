import { Component, Input, OnInit } from '@angular/core';
import { analyticsConfig } from 'configuration/analytics-config';
import { SortEvent } from 'primeng/api';
import { tableLocalSortHandler, TableRow } from 'shared/utils/table-local-sort-handler';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import { Report, ReportService } from 'shared/services';
import { HighlightsDatesConfig } from './highlights-dates.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { CompareService } from 'shared/services/compare.service';

@Component({
  selector: 'manual-playlist-dates-table',
  templateUrl: './dates-table.component.html',
  styleUrls: ['./dates-table.component.scss'],
  providers: [HighlightsDatesConfig],
})
export class ManualPlylistDatesTableComponent implements OnInit {
  @Input() isCompareMode: boolean;
  @Input() firstTimeLoading: boolean;
  @Input() reportInterval: KalturaReportInterval;
  @Input() currentPeriod: { from: number, to: number };
  @Input() comparePeriod: { from: number, to: number };

  @Input() set data(value: { current: Report, compare?: Report }) {
    if (value) {
      setTimeout(() => {
        if (value.compare) {
          this._handleCompare(value.current, value.compare);
        } else if (value.current) {
          this._handleTable(value.current);
        }
      }, 200); // use a timeout to verify currentPeriod and comparePeriod bindings update properly
    }
  }

  @Input() compare;
  @Input() sortField: string;

  private _order = '-date_id';
  private _dataConfig: ReportDataConfig;

  public _pageSize = analyticsConfig.defaultPageSize;
  public _tableData: TableRow = [];
  public _columns: string[] = [];

  constructor(private _reportService: ReportService,
              private _compareService: CompareService,
              private _dataConfigService: HighlightsDatesConfig) {
    this._dataConfig = this._dataConfigService.getConfig();

  }

  ngOnInit() {
  }

  private _handleTable(report: Report): void {
    const graphs = report.graphs;
    const { columns, tableData, totalCount } = this._reportService.tableFromGraph(
      graphs,
      this._dataConfig.table,
      this.reportInterval,
    );
    this._columns = columns;
    this._tableData = tableData;
  }

  private _handleCompare(current: Report, compare: Report): void {
    if (current.graphs.length && compare.graphs.length) {
      const compareTableData = this._compareService.compareTableFromGraph(
        this.currentPeriod,
        this.comparePeriod,
        current.graphs,
        compare.graphs,
        this._dataConfig.table,
        this.reportInterval,
      );

      if (compareTableData) {
        const { columns, tableData, totalCount } = compareTableData;
        this._columns = columns;
        this._tableData = tableData;
      }
    }
  }

  public _onSortChanged(event: SortEvent) {
    this._order = tableLocalSortHandler(event, this._order, this.isCompareMode);
  }
}
