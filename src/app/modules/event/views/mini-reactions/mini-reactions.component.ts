import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-event-mini-reactions',
  templateUrl: './mini-reactions.component.html',
  styleUrls: ['./mini-reactions.component.scss']
})
export class EventMiniReactionsComponent {

  protected _componentId = 'event-mini-reactions';

  @Input() isBusy = true;
  @Input() reactionsRate = 0;
  @Input() reactionsCount = '0';

}
