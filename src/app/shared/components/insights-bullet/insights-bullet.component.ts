import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';

@Component({
  selector: 'app-insights-bullet',
  templateUrl: './insights-bullet.component.html',
  styleUrls: ['./insights-bullet.component.scss']
})
export class InsightsBulletComponent implements OnChanges{
  public _topValuePercent = 0;
  public _othersValuePercent = 0;
  public _topValueColor = getPrimaryColor();
  public _othersColor = getSecondaryColor();

  @Input() topValue = 0;
  @Input() othersValue = 0;

  @Input() set colorScheme(type: string) {
    this._topValueColor = getPrimaryColor(type);
    this._othersColor = getSecondaryColor(type);
  }

  @Input() topLabel = '';
  @Input() othersLabel = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes.topValue && changes.topValue.currentValue) {
      setTimeout( () => {
        this.drawBullet();
      }, 200);
    }
  }

  private drawBullet(): void {
    this._topValuePercent = ( this.topValue / (this.topValue + this.othersValue) ) * 100 ;
    this._othersValuePercent = 100 - this._topValuePercent ;
  }
}
