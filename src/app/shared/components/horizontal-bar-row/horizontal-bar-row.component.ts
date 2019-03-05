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

@Component({
  selector: 'app-horizontal-bar-row',
  templateUrl: './horizontal-bar-row.component.html',
  styleUrls: ['./horizontal-bar-row.component.scss']
})
export class HorizontalBarRowComponent {
  @Input() label: string;
  @Input() units = '%';
  @Input() formatter: Function = significantDigits;
  
  @Input() set tooltip(value: BarRowTooltip | BarRowTooltip[]) {
    if (Array.isArray(value)) {
    
    } else {
    
    }
  }
  
  @Input() set value(value: BarRowValue | BarRowValue[]) {
    if (Array.isArray(value)) {
      this._rawValue = value[0];
      this._rawCompareValue = value[1];
    } else {
      this._rawValue = value;
      this._compareValue = null;
      this._trend = null;
    }
    
    setTimeout(() => {
      this._value = typeof this.formatter === 'function' ? this.formatter(this._rawValue) : this._rawValue;
      if (this._rawCompareValue !== null) {
        this._compareValue = typeof this.formatter === 'function' ? this.formatter(this._rawCompareValue) : this._rawCompareValue;
  
        const { value, direction } = this._trendService.calculateTrend(Number(this._rawValue), Number(this._rawCompareValue));
        this._trend = {
          value,
          trend: direction,
          units: '%'
        };
      }
    }, 200);
  }
  
  @Input() set colorScheme(type: string) {
    this._colors = [getPrimaryColor(type), getSecondaryColor(type)];
  }
  
  public _trend: any = null;
  public _value: BarRowValue = null;
  public _rawValue: BarRowValue = null;
  public _compareValue: BarRowValue = null;
  public _rawCompareValue: BarRowValue = null;
  public _colors = [getPrimaryColor(), getSecondaryColor()];
  
  constructor(private _trendService: TrendService) {

  }
}
