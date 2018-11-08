import { Component, Input } from '@angular/core';
import { significantDigits } from 'shared/utils/significant-digits';

@Component({
  selector: 'app-bullet',
  templateUrl: './bullet.component.html',
  styleUrls: ['./bullet.component.scss']
})
export class BulletComponent {
  public _value = 0;
  
  @Input() formatter: Function = significantDigits;
  
  @Input() set value(value: any) {
    setTimeout(() => {
      this._value = typeof this.formatter === 'function' ? this.formatter(value) : value;
    }, 200);
  }
}
