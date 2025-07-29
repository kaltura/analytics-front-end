import { Component, Input } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import {PageScrollConfig, PageScrollInstance, PageScrollService} from "ngx-page-scroll";
import {AppAnalytics, ButtonType} from "shared/services";

@Component({
  selector: 'app-event-interactivity',
  templateUrl: './event-interactivity.component.html',
  styleUrls: ['./event-interactivity.component.scss'],
  providers: [
    KalturaLogger.createLogger('EventInteractivityComponent')
  ]
})
export class EventInteractivityComponent {

  protected _componentId = 'event-interactivity';
  @Input() exporting = false;
  @Input()  _reactionsCount = '0';
  @Input()  _messagesCount = '0';
  @Input()  _questionsCount = '0';
  @Input()  _downloadCount = '0';
  @Input()  _pollsCount = '0';
  @Input() _isBusy: boolean;

  constructor(private pageScrollService: PageScrollService,
              private _logger: KalturaLogger,
              private _analytics: AppAnalytics,
              private _frameEventManager: FrameEventManagerService) {
  }

  public scrollTo(target: string): void {
    this._logger.trace('Handle scroll to details report action by user', { target });
    this._analytics.trackButtonClickEvent(ButtonType.Browse, 'events_user_dashboard_polls_see_details', null, 'events_user_dashboard');
    if (analyticsConfig.isHosted) {
      const targetEl = document.getElementById(target.substr(1)) as HTMLElement;
      if (targetEl) {
        this._logger.trace('Send scrollTo event to the host app', { offset: targetEl.offsetTop });
        this._frameEventManager.publish(FrameEvents.ScrollTo, targetEl.offsetTop);
      }
    } else {
      PageScrollConfig.defaultDuration = 500;
      const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(document, target);
      this.pageScrollService.start(pageScrollInstance);
    }
  }

}
