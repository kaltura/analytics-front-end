import { Component, Input } from '@angular/core';
import {ReactionsBreakdown} from "./reactions-breakdown.config";

@Component({
  selector: 'app-reactions-breakdown-overlay',
  templateUrl: './reactions-breakdown-overlay.component.html',
  styleUrls: ['./reactions-breakdown-overlay.component.scss'],
})
export class ReactionsBreakdownOverlayComponent {

  constructor() {
  }

  @Input() set ReactionsBreakdown(breakdown) {
    this._reactionsBreakdown = breakdown;
  }

  public _reactionsBreakdown: ReactionsBreakdown = {
    Clap: 0,
    Smile: 0,
    Wow: 0,
    Heart: 0,
    Think: 0
  }
}
