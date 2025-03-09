import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './entry-ep.routes';
import { EntryEpViewComponent } from './entry-ep-view.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule, PopupWidgetModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { EpMiniViewersComponent } from "./views/mini-viewers/mini-viewers.component";
import { EpMiniMinutesViewedComponent } from "./views/mini-minutes-viewed/mini-minutes-viewed.component";
import { EpMiniPlaysComponent } from "./views/mini-plays/mini-plays.component";
import { EpRecordingsComponent } from "./views/recordings/recordings.component";
import { EpPollsComponent } from "./views/polls/polls.component";
import { SelectButtonModule } from "primeng/selectbutton";
import { UsersTableComponent } from "./views/recordings/users-table/users-table.component";
import { EntriesTableComponent } from "./views/recordings/entries-table/entries-table.component";
import { EpMiniEngagementComponent } from "./views/mini-engagement/mini-engagement.component";
import { EpSessionComponent } from "./views/session/session.component";
import { ReactionsComponent } from "./views/session/reactions/reactions.component";
import { ReactionIconComponent } from "./views/session/reactions/reaction-icon.component";
import { EpDevicesComponent } from "./views/devices/devices.component";
import { EpGeoComponent } from "./views/geo/geo-location.component";
import { EpViewerEngagementComponent } from "./views/session/viewer-engagement/viewer-engagement.component";
import { EpHeatMapComponent } from "./views/session/viewer-engagement/heat-map/heat-map.component";

@NgModule({
  imports: [
    AreaBlockerModule,
    TagsModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    PaginatorModule,
    SelectButtonModule,
    SharedModule,
    TableModule,
    TooltipModule,
    PopupWidgetModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    AutoCompleteModule,
    OverlayPanelModule,
    InputHelperModule,
  ],
  declarations: [
    EntryEpViewComponent,
    EpMiniViewersComponent,
    EpMiniMinutesViewedComponent,
    EpMiniPlaysComponent,
    EpRecordingsComponent,
    UsersTableComponent,
    EntriesTableComponent,
    EpMiniEngagementComponent,
    EpSessionComponent,
    EpPollsComponent,
    EpViewerEngagementComponent,
    EpHeatMapComponent,
    ReactionsComponent,
    ReactionIconComponent,
    EpDevicesComponent,
    EpGeoComponent
  ],
  exports: [],
  providers: []
})
export class EntryEpModule {
}
