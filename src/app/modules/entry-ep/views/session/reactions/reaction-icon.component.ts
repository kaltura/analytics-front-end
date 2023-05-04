import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-ep-reaction-icon',
  templateUrl: './reaction-icon.component.html',
  styleUrls: ['./reaction-icon.component.scss']
})
export class ReactionIconComponent {
  @Input() reaction: { totalClicks: number, topReaction: string, positionPercent: string };

  public isHover = false;

  public onMouseEnter(): void {
    this.isHover = true;
  }
  public onMouseLeave(): void {
    this.isHover = false;
  }
}
