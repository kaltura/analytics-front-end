import { Component, Input } from '@angular/core';

export interface StatusBulletValue {
  value: number;
  label: string;
  color?: string;
  tooltip?: string;
}

@Component({
  selector: 'app-status-bullet',
  templateUrl: './status-bullet.component.html',
  styleUrls: ['./status-bullet.component.scss']
})
export class StatusBulletComponent {
  @Input() set values(values: StatusBulletValue[]) {
    if (Array.isArray(values)) {
      const sum = values.reduce((acc, val) => acc + val.value, 0);
      this._values = values.map(item => {
        item.value = sum
          ? Math.round(item.value / sum * 100)
          : values.length === 1 ? 100 : 0;
        return item;
      });
    }
  }
  
  public _values: StatusBulletValue[] = [];
}
