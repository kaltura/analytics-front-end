import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-trend-value',
  template: `
    <i [class]="trend | appTrend"></i>
    <span [ngClass]="valueStyleClass" *ngIf="value !== '–'">{{value}}&nbsp;<span [ngClass]="unitsStyleClass">{{units}}</span></span>
    <i class="kValue icon-minus" *ngIf="value === '–'"></i>
  `
})
export class TrendValueComponent {
  @Input() value: string;
  @Input() units: string;
  @Input() trend: number;
  @Input() valueStyleClass: string;
  @Input() unitsStyleClass: string;
}
