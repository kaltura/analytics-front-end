import { Component } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

export enum EntryLiveUsersMode {
  Authenticated = 'authenticated',
  All = 'all',
}

@Component({
  selector: 'app-toggle-users-mode',
  templateUrl: './toggle-users-mode.component.html',
  styleUrls: ['./toggle-users-mode.component.scss']
})
export class ToggleUsersModeComponent {
  public _selected = EntryLiveUsersMode.All;
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
  
  constructor(private _translate: TranslateService) {
  
  }
  
  public _onModeChange(event: { originalEvent: MouseEvent, value: EntryLiveUsersMode }): void {
    console.warn(event.value);
    window.localStorage.set('kmc-analytics-users-mode', event.value);
  }
}
