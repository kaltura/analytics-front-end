import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { Subject } from 'rxjs';
import { SortEvent } from "primeng/api";
import { Node } from '../path-content.component';

@Component({
  selector: 'app-path-content-table',
  templateUrl: './path-content-table.component.html',
  styleUrls: ['./path-content-table.component.scss']
})
export class PathContentTableComponent implements OnDestroy {
  @Input() set tableData(value: TableRow<string>[]) {
    value = Array.isArray(value) ? value : [];
    this._tableData = value;
    this._totalCount = value.length;
  }
  
  @Input() showDivider = false;
  @Input() dates: string;
  @Input() isCompareMode: boolean;
  @Input() firstTimeLoading = true;
  @Input() name = 'default';
  
  @Output() drillDown: EventEmitter<Node> = new EventEmitter();
  
  private _paginationChanged = new Subject<void>();
  
  public _totalCount = 0;
  public _tableData: TableRow<string>[] = [];
  
  constructor() { }
  
  ngOnDestroy(): void {
    this._paginationChanged.complete();
  }
  
  public customSort(event: SortEvent) {
    event.data.sort((data1, data2) => {
      const numericFields = ['level', 'count_node_plays', 'unique_known_users', 'avg_completion_rate'];
      let result;
      let value1 = data1[event.field];
      let value2 = data2[event.field];
      // fix undefined values that brakes numeric sorting
      value1 = typeof value1 === 'undefined' ? Infinity : value1;
      value2 = typeof value2 === 'undefined' ? Infinity : value2;

      if (numericFields.indexOf(event.field) > -1) {
        result = (parseFloat(value1) < parseFloat(value2)) ? -1 : (parseFloat(value1) > parseFloat(value2)) ? 1 : 0; // numeric compare
      } else {
        result = value1.localeCompare(value2); // string compare
      }
      return (event.order * result);
    });
  }
  
  public _drillDown(data: Node): void {
    this.drillDown.emit(data);
  }
}
