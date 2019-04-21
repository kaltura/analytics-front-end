import { Component, Input } from '@angular/core';
import { getColorsBetween, getColorPalette } from 'shared/utils/colors';

export interface InsightsBulletValue {
  value: number;
  label: string;
  color?: string;
  tooltip?: string;
}

@Component({
  selector: 'app-insights-bullet',
  templateUrl: './insights-bullet.component.html',
  styleUrls: ['./insights-bullet.component.scss']
})
export class InsightsBulletComponent {
  @Input() set values(value: InsightsBulletValue[]) {
    this._values = [];

    if (Array.isArray(value)) {
      const sum = value.reduce((acc, val) => acc + val.value, 0);
      const colors = getColorsBetween(getColorPalette()[0], getColorPalette()[7], value.length);
      this._values = value
        .map((item, index) => {
          const result = sum ? parseFloat((item.value / sum * 100).toFixed(2)) : 0;
          const color = colors[index];
          const tooltip = `<div class="kDefaultTooltip"><span class="kBullet" style="color: ${color}">&bull;</span><span style="margin-right: 8px">${item.label}</span><span>${result}%</span></div>`;
          return {
            value: result,
            label: item.label,
            color,
            tooltip,
          };
        });
    }
  }
  
  @Input() colorScheme = 'default';
  
  public _values: InsightsBulletValue[] = [];
}
