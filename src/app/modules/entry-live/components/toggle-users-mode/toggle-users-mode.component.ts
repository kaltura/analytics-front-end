import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { EntryLiveUsersMode } from 'configuration/analytics-config';
import { ToggleUsersModeService } from './toggle-users-mode.service';

@Component({
  selector: 'app-toggle-users-mode',
  templateUrl: './toggle-users-mode.component.html',
  styleUrls: ['./toggle-users-mode.component.scss']
})
export class ToggleUsersModeComponent implements OnDestroy {
  @Output() modeChanges = new EventEmitter<void>();
  
  public _selected = this._toggleUsersModeService.usersMode;
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
              private _frameEventManager: FrameEventManagerService,
              private _toggleUsersModeService: ToggleUsersModeService) {
  }
  
  ngOnDestroy(): void {
  }
  
  public _onModeChange(event: { originalEvent: MouseEvent, value: EntryLiveUsersMode }): void {
    this._toggleUsersModeService.changeMode(event.value);
    this.modeChanges.emit();
  }
}
