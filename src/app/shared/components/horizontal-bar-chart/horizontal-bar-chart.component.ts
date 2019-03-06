import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BarRowTooltip, BarRowValue } from 'shared/components/horizontal-bar-row/horizontal-bar-row.component';
import { KalturaPager } from 'kaltura-ngx-client';

export interface BarChartRow {
  label: string;
  value: BarRowValue | BarRowValue[];
  tooltip: BarRowTooltip | BarRowTooltip[];
  index?: number;
}

@Component({
  selector: 'app-horizontal-bar-chart',
  templateUrl: './horizontal-bar-chart.component.html',
  styleUrls: ['./horizontal-bar-chart.component.scss'],
})
export class HorizontalBarChartComponent {
  @Input() data: BarChartRow[] = [];
  @Input() colorScheme: string;
  @Input() firstTimeLoading = false;
  @Input() isBusy = false;
  @Input() pager: KalturaPager;
  @Input() totalCount: number;
  @Input() isCompareMode = false;
  
  @Output() paginationChanged = new EventEmitter();
  
  constructor() {
  
  }
}
