import { Component, Input, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-bullet',
  templateUrl: './bullet.component.html',
  styleUrls: ['./bullet.component.scss']
})
export class BulletComponent implements AfterViewInit {

  @Input() value: number;
  public _value = 0;

  constructor() {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this._value = parseFloat(this.value.toPrecision(2));
    }, 200);

  }
}
