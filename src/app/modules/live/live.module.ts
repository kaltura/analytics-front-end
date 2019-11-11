import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { routing } from './live.routes';
import { AreaBlockerModule, KalturaUIModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { EntriesLiveComponent } from './views/entries-live/entries-live.component';
import { EntriesLivePollsService } from './views/entries-live/entries-live-polls.service';
import { TableModule } from 'primeng/table';
import { TranslateModule } from '@ngx-translate/core';
import { EntriesLiveDataConfig } from './views/entries-live/entries-live-data.config';
import { EntryDetailsOverlayComponent } from './views/entries-live/entry-details-overlay/entry-details-overlay.component';
import { SharedModule } from 'shared/shared.module';
import { EntriesLiveNoDataIconComponent } from './views/entries-live/entries-live-no-data-icon/entries-live-no-data-icon.component';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';

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
    EntriesLiveComponent,
    EntryDetailsOverlayComponent,
    EntriesLiveNoDataIconComponent,
  ],
  providers: [
    EntriesLivePollsService,
    EntriesLiveDataConfig,
  ]
})
export class LiveModule {
}
