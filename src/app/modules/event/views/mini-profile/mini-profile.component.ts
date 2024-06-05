import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import {Router} from "@angular/router";
import {OverlayPanel} from "primeng/overlaypanel";

export type Profile = {
  metric: string; // 'company' | 'role' | 'industry' | 'country';
  label: string;
  count: number;
};

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

  public _profiles: Profile[] = [];
  public _currentProfile: Profile = null;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _router: Router) {
  }

  ngOnInit(): void {
    this._isBusy = true;
    setTimeout(() => {
      this._isBusy = false;
      const profiles = [{metric: 'country', label: 'Canada', count: 100},
        {metric: 'country', label: 'United sates of america', count: 100},
        {metric: 'country', label: 'Israel', count: 100},
        {metric: 'role', label: 'CEO', count: 100},
        {metric: 'role', label: 'Director of customer success', count: 100},
        {metric: 'role', label: 'Front-end developer', count: 100},
        {metric: 'industry', label: 'Technology', count: 100},
        {metric: 'industry', label: 'Healthcare & Biotech', count: 100},
        {metric: 'industry', label: 'Marketing', count: 100}];
      this._profiles = this.shuffle(profiles);
    }, 1000);
  }

  private shuffle = (array: Profile[]) => {
    // Fisher-Yates Sorting Algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  public _showOverlay(event: any, profile: Profile): void {
    if (this._overlay) {
      this._currentProfile = profile;
      this._overlay.show(event);
    }
  }

  public _hideOverlay(): void {
    if (this._overlay) {
      this._currentProfile = null;
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
