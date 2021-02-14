import { Component, Input } from '@angular/core';
import { significantDigits } from 'shared/utils/significant-digits';
import { getColorPercent } from 'shared/utils/colors';

@Component({
  selector: 'app-bullet',
  templateUrl: './bullet.component.html',
  styleUrls: ['./bullet.component.scss']
})
export class BulletComponent {
  public _value = 0;
  public _color = getColorPercent(65);

  @Input() formatter: Function = significantDigits;
  @Input() animate = true;
  @Input() colorPercent = 65;
  @Input() hideBulletOnTablet = false;

  @Input() set value(value: any) {
    if (this.animate) {
      setTimeout(() => {
        this._setValue(value);
      }, 200);
    } else {
      this._setValue(value);
    }

  }

  @Input() set colorScheme(type: string) {
    this._color = getColorPercent(this.colorPercent, type);
  }

  private _setValue(value: any): void {
    this._value = typeof this.formatter === 'function' ? this.formatter(value) : value;
  }
}
