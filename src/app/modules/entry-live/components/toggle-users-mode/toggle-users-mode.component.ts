import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter } from 'rxjs/operators';

export enum EntryLiveUsersMode {
  Authenticated = 'authenticated',
  All = 'all',
}

@Component({
  selector: 'app-toggle-users-mode',
  templateUrl: './toggle-users-mode.component.html',
  styleUrls: ['./toggle-users-mode.component.scss']
})
export class ToggleUsersModeComponent implements OnDestroy {
  @Output() modeChanges = new EventEmitter<void>();
  
  public _selected = analyticsConfig.authUsersLiveReports ? EntryLiveUsersMode.Authenticated : EntryLiveUsersMode.All;
  public _options: SelectItem[] = [
    {
      value: EntryLiveUsersMode.Authenticated,
      label: this._translate.instant(`app.entryLive.userModes.${EntryLiveUsersMode.Authenticated}.title`)
    },
    {
      value: EntryLiveUsersMode.All,
      label: this._translate.instant(`app.entryLive.userModes.${EntryLiveUsersMode.All}.title`)
    }
  ];
  
  constructor(private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService) {
    this._frameEventManager.listen(FrameEvents.UpdateAuthLiveUsersReports)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(() => this.modeChanges.emit());
  }
  
  ngOnDestroy(): void {
  }
  
  public _onModeChange(event: { originalEvent: MouseEvent, value: EntryLiveUsersMode }): void {
    analyticsConfig.authUsersLiveReports = event.value === EntryLiveUsersMode.Authenticated;

    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.UpdateAuthLiveUsersReports, event.value);
    } else {
      this.modeChanges.emit();
    }
  }
}
