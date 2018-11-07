import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-bullet',
  templateUrl: './bullet.component.html',
  styleUrls: ['./bullet.component.scss']
})
export class BulletComponent {
  public _value = 0;
  
  @Input() set value(value: any) {
    this._value = Number(parseFloat(value).toFixed(2)));
  }
}
