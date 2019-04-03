import { Component, Input } from '@angular/core';
import { getColorPercent, getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

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
      this._values = value
        .map((item, index) => {
          const result = sum ? parseFloat((item.value / sum * 100).toFixed(2)) : 0;
          let color = getColorPercent(result, this.colorScheme);
          if (value.length <= 2) {
            color = index === 0 ? getPrimaryColor(this.colorScheme) : getSecondaryColor(this.colorScheme);
          }
          const tooltip = `
            <div class="kDefaultTooltip">
              <span class="kBullet" style="color: ${color}">&bull;</span>
              <span style="margin-right: 8px">${item.label}</span><span>${result}%</span>
            </div>
          `;
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
