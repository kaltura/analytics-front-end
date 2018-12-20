import { Component, Input } from '@angular/core';
import { significantDigits } from 'shared/utils/significant-digits';
import { getPrimaryColor } from 'shared/utils/colors';

@Component({
  selector: 'app-bullet',
  templateUrl: './bullet.component.html',
  styleUrls: ['./bullet.component.scss']
})
export class BulletComponent {
  public _value = 0;
  public _color = getPrimaryColor();
  
  @Input() formatter: Function = significantDigits;
  
  @Input() set value(value: any) {
    setTimeout(() => {
      this._value = typeof this.formatter === 'function' ? this.formatter(value) : value;
    }, 200);
  }
  
  @Input() set colorScheme(type: string) {
    this._color = getPrimaryColor(type);
  }
}
