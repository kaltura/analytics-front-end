import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routing } from './live.routes';
import { KalturaUIModule } from '@kaltura-ng/kaltura-ui';
import { LiveComponent } from './live.component';
import { EntriesLiveComponent } from './views/entries-live/entries-live.component';
import { LiveReportsComponent } from './views/live-reports/live-reports.component';
import { EntriesLiveGuard } from './views/entries-live/entries-live.guard';
import { LiveReportsGuard } from './views/live-reports/live-reports.guard';

@NgModule({
  imports: [
    RouterModule.forChild(routing),
    KalturaUIModule
  ],
  declarations: [
    LiveComponent,
    EntriesLiveComponent,
    LiveReportsComponent,
  ],
  providers: [
    EntriesLiveGuard,
    LiveReportsGuard,
  ]
})
export class LiveModule {
}
