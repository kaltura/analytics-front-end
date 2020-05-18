import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { routing } from './live.routes';
import { AreaBlockerModule, KalturaUIModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { LiveEntriesComponent } from './views/live-entries/live-entries.component';
import { TableModule } from 'primeng/table';
import { TranslateModule } from '@ngx-translate/core';
import { EntryDetailsOverlayComponent } from './views/live-entries/ended/entry-details-overlay/entry-details-overlay.component';
import { SharedModule } from 'shared/shared.module';
import { EntriesLiveNoDataIconComponent } from './views/live-entries/entries-live-no-data-icon/entries-live-no-data-icon.component';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { BroadcastingComponent } from "./views/live-entries/broadcasting/broadcasting.component";
import { EndedComponent } from "./views/live-entries/ended/ended.component";
import { BroadcastingEntriesService } from "./views/live-entries/broadcasting/broadcasting-entries.service";
import { BroadcastingEntriesDataConfig } from "./views/live-entries/broadcasting/broadcasting-entries-data.config";
import { RecordingStatusPipe } from "./views/live-entries/pipes/recording-status.pipe";
import { DVRStatusPipe } from "./views/live-entries/pipes/dvr-status.pipe";
import { BroadcastStatusPipe } from "./views/live-entries/pipes/broadcast-status.pipe";
import {EndedPollsService} from "./views/live-entries/ended/ended-polls.service";
import {EndedDataConfig} from "./views/live-entries/ended/ended-data.config";

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
    LiveEntriesComponent,
    BroadcastingComponent,
    EndedComponent,
    EntryDetailsOverlayComponent,
    EntriesLiveNoDataIconComponent,
    RecordingStatusPipe,
    DVRStatusPipe,
    BroadcastStatusPipe
  ],
  providers: [
    BroadcastingEntriesDataConfig,
    BroadcastingEntriesService,
    EndedDataConfig,
    EndedPollsService
  ]
})
export class LiveModule {
}
