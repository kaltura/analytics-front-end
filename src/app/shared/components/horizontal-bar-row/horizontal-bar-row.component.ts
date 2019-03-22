import { Component, Input } from '@angular/core';
import { significantDigits } from 'shared/utils/significant-digits';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
import { TrendService } from 'shared/services/trend.service';

export type BarRowValue = number | string;

export interface BarRowTooltip {
  value: string;
  label: string;
  color?: string;
}

export interface TrendValue {
  value: string;
  units: string;
  trend: number;
  tooltip: string;
}

@Component({
  selector: 'app-horizontal-bar-row',
  templateUrl: './horizontal-bar-row.component.html',
  styleUrls: ['./horizontal-bar-row.component.scss']
})
export class HorizontalBarRowComponent {
  @Input() label: string;
  @Input() units = '%';
  @Input() formatter: Function = significantDigits;
  @Input() currentPeriod: string;
  @Input() comparePeriod: string;
  @Input() tooltipFormatter = this._getTooltipString;
  
  @Input() set trend(value: TrendValue) {
    if (value) {
      this._trend = value;
      this._calculateTrend = false;
    } else {
      this._calculateTrend = true;
    }
  }
  
  @Input() set tooltip(value: BarRowTooltip | BarRowTooltip[]) {
    setTimeout(() => {
      if (Array.isArray(value)) {
        this._tooltip = this.tooltipFormatter(value[0].value, value[0].label, value[0].color || this._colors[0]);
        this._compareTooltip = this.tooltipFormatter(value[1].value, value[1].label, value[1].color || this._colors[1]);
      } else {
        this._tooltip = this.tooltipFormatter(value.value, value.label, value.color || this._colors[0]);
        this._compareTooltip = null;
      }
    }, 200);
  }
  
  @Input() set value(value: BarRowValue | BarRowValue[]) {
    if (Array.isArray(value)) {
      this._rawValue = value[0];
      this._rawCompareValue = value[1];
    } else {
      this._rawValue = value;
      this._rawCompareValue = null;
      this._compareValue = null;
      this._trend = null;
    }
    
    setTimeout(() => {
      this._value = typeof this.formatter === 'function' ? this.formatter(this._rawValue) : this._rawValue;
      if (this._rawCompareValue !== null && this.currentPeriod && this.comparePeriod) {
        this._compareValue = typeof this.formatter === 'function' ? this.formatter(this._rawCompareValue) : this._rawCompareValue;
        
        if (this._calculateTrend) {
          const { value, direction } = this._trendService.calculateTrend(Number(this._rawValue), Number(this._rawCompareValue));
          this._trend = {
            value: value !== null ? value : '–',
            trend: direction,
            units: value !== null ? '%' : '',
            tooltip: `${this._trendService.getTooltipRowString(this.currentPeriod, this._rawValue, '%')}${this._trendService.getTooltipRowString(this.comparePeriod, this._rawCompareValue, '%')}`,
          };
        }
      }
    }, 200);
  }
  
  @Input() set colorScheme(type: string) {
    this._colors = [getPrimaryColor(type), getSecondaryColor(type)];
  }
  
  private _calculateTrend = true;
  public _trend: TrendValue = null;
  public _value: BarRowValue = 0;
  public _rawValue: BarRowValue = 0;
  public _compareValue: BarRowValue = 0;
  public _rawCompareValue: BarRowValue = 0;
  public _tooltip: string = null;
  public _compareTooltip: string = null;
  public _colors = [getPrimaryColor(), getSecondaryColor()];
  
  constructor(private _trendService: TrendService) {
  
  }
  
  private _getTooltipString(value: string, label: string, color?: string): string {
    return `
      <div class="kHorizontalBarGraphTooltip">
        <span class="kBullet" style="color: ${color}">&bull;</span>
        <span>${label}: ${value}</span>
      </div>
    `;
  }
}
