import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import {Router} from "@angular/router";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
  selector: 'app-event-mini-profile',
  templateUrl: './mini-profile.component.html',
  styleUrls: ['./mini-profile.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniProfileComponent')
  ]
})

export class MiniProfileComponent implements OnInit, OnDestroy {

  protected _componentId = 'event-mini-profile';

  @Input() eventIn = '';
  @ViewChild('overlay') _overlay: OverlayPanel;

  public _isBusy = false;

  public _profiles = [];
  public _currentProfile = '';

  constructor(private _frameEventManager: FrameEventManagerService,
              private _router: Router) {
  }

  ngOnInit(): void {
    this._isBusy = true;
    setTimeout(() => {
      this._isBusy = false;
      this._profiles = ['Oracle', 'Amazon', 'Kaltura', 'Canada', 'United sates of america', 'Israel', 'CEO', 'Director of customer success', 'Technology', 'Helthcare & Biotech'];
    }, 1000);
  }

  public _showOverlay(event: any, profile: string): void {
    if (this._overlay) {
      this._currentProfile = profile;
      this._overlay.show(event);
    }
  }

  public _hideOverlay(): void {
    if (this._overlay) {
      this._currentProfile = '';
      this._overlay.hide();
    }
  }

  public breakdown(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/virtual-event/${this.eventIn}`);
    } else {
      this._router.navigate([`/virtual-event/${this.eventIn}`]);
    }
  }

  ngOnDestroy(): void {
  }

}
