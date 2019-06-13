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

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routing),
    KalturaUIModule,
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
