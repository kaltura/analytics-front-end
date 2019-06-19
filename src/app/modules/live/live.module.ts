import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { routing } from './live.routes';
import { AreaBlockerModule, KalturaUIModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { LiveComponent } from './live.component';
import { EntriesLiveComponent } from './views/entries-live/entries-live.component';
import { LiveReportsComponent } from './views/live-reports/live-reports.component';
import { EntriesLiveGuard } from './views/entries-live/entries-live.guard';
import { LiveReportsGuard } from './views/live-reports/live-reports.guard';
import { EntriesLivePollsService } from './views/entries-live/entries-live-polls.service';
import { TableModule } from 'primeng/table';
import { InputTextModule, PaginatorModule } from 'primeng/primeng';
import { TranslateModule } from '@ngx-translate/core';
import { EntriesLiveDataConfig } from './views/entries-live/entries-live-data.config';
import { EntryDetailsOverlayComponent } from './views/entries-live/entry-details-overlay/entry-details-overlay.component';
import { SharedModule } from 'shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routing),
    KalturaUIModule,
    SharedModule,
    TableModule,
    PaginatorModule,
    TranslateModule,
    AreaBlockerModule,
    InputTextModule,
    TooltipModule,
  ],
  declarations: [
    LiveComponent,
    EntriesLiveComponent,
    LiveReportsComponent,
    EntryDetailsOverlayComponent,
  ],
  providers: [
    EntriesLiveGuard,
    LiveReportsGuard,
    EntriesLivePollsService,
    EntriesLiveDataConfig,
  ]
})
export class LiveModule {
}
