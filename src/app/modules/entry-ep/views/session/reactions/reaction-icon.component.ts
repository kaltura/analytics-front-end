import {Component, Input} from '@angular/core';
import {AppAnalytics, ButtonType} from "shared/services";

@Component({
  selector: 'app-ep-reaction-icon',
  templateUrl: './reaction-icon.component.html',
  styleUrls: ['./reaction-icon.component.scss']
})
export class ReactionIconComponent {
  @Input() reaction: { totalClicks: number, topReaction: string, positionPercent: string };
  @Input() exporting = false;

  public isHover = false;

  constructor(private _analytics: AppAnalytics) {
  }
  public onMouseEnter(): void {
    this.isHover = true;
    this._analytics.trackButtonClickEvent(ButtonType.Browse, 'Events_session_hover_reactions');
  }
  public onMouseLeave(): void {
    this.isHover = false;
  }
}
