import { Component } from '@angular/core';

export enum LiveReportTabs {
  broadcasting = 'broadcasting',
  ended = 'ended',
  upcoming = 'upcoming'
}

@Component({
  selector: 'app-live-entries',
  templateUrl: './live-entries.component.html',
  styleUrls: ['./live-entries.component.scss'],
  providers: []
})
export class LiveEntriesComponent {

  public _reportTabs = LiveReportTabs;
  public _currentTab = LiveReportTabs.broadcasting;

  constructor() {
  }

  public _selectTab(tab: LiveReportTabs): void {
    this._currentTab = tab;
  }

}
