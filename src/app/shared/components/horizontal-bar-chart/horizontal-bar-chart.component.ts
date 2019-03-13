import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BarRowTooltip, BarRowValue } from 'shared/components/horizontal-bar-row/horizontal-bar-row.component';
import { KalturaPager } from 'kaltura-ngx-client';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';

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
  @Input() firstTimeLoading = false;
  @Input() isBusy = false;
  @Input() pager: KalturaPager;
  @Input() totalCount: number;
  @Input() isCompareMode = false;
  @Input() set currentPeriod(value: { from: number, to: number }) {
    if (value && value.hasOwnProperty('from') && value.hasOwnProperty('to')) {
      this._currentPeriod = value;
      this._currentPeriodLabel = `${DateFilterUtils.formatMonthDayString(value.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(value.to, analyticsConfig.locale)}`;
    }
  }
  @Input() set comparePeriod(value: { from: number, to: number }) {
    if (value && value.hasOwnProperty('from') && value.hasOwnProperty('to')) {
      this._comparePeriod = value;
      this._comparePeriodLabel = `${DateFilterUtils.formatMonthDayString(value.from, analyticsConfig.locale)} – ${DateFilterUtils.formatMonthDayString(value.to, analyticsConfig.locale)}`;
    }
  }
  @Input() set colorScheme(value: string) {
    if (typeof value === 'string') {
      this._colorScheme = value;
      this._colors = [getPrimaryColor(value), getSecondaryColor(value)];
    }
  }
  
  @Output() paginationChanged = new EventEmitter();
  
  public _colorScheme: string;
  public _colors: [string, string] = [getPrimaryColor(), getSecondaryColor()];
  public _currentPeriod: { from: number, to: number };
  public _comparePeriod: { from: number, to: number };
  public _currentPeriodLabel: string;
  public _comparePeriodLabel: string;
}
