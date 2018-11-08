import { Component, Input } from '@angular/core';
import { numberToFixed } from 'shared/utils/number-to-fixed';

@Component({
  selector: 'app-bullet',
  templateUrl: './bullet.component.html',
  styleUrls: ['./bullet.component.scss']
})
export class BulletComponent {
  public _value = 0;
  
  @Input() set value(value: any) {
    setTimeout(() => {
      this._value = numberToFixed(value);
    }, 200);
  }
}
