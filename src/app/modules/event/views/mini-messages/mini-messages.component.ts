import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-event-mini-messages',
  templateUrl: './mini-messages.component.html',
  styleUrls: ['./mini-messages.component.scss']
})
export class EventMiniMessagesComponent {

  protected _componentId = 'event-mini-messages';

  @Input() isBusy = true;
  @Input() messagesRate = 0;
  @Input() messagesCount = '0';

}
