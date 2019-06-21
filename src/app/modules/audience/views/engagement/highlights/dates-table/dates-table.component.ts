import { Component, Input, OnInit } from '@angular/core';
import { analyticsConfig } from 'configuration/analytics-config';
import { SortEvent } from 'primeng/api';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { tableLocalSortHandler, TableRow } from 'shared/utils/table-local-sort-handler';

@Component({
  selector: 'app-dates-table',
  templateUrl: './dates-table.component.html',
  styleUrls: ['./dates-table.component.scss']
})
export class DatesTableComponent implements OnInit {
  @Input() isCompareMode: boolean;
  @Input() firstTimeLoading: boolean;
  @Input() current;
  @Input() compare;
  
  private _order = '-count_plays';

  public _pageSize = analyticsConfig.defaultPageSize;
  public _tableData: TableRow = [];
  public _columns: string[] = [];

  constructor() { }

  ngOnInit() {
  }
  
  public _onSortChanged(event: SortEvent) {
    this._order = tableLocalSortHandler(event, this._order, this.isCompareMode);
  }
}
