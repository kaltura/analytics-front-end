import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './audience.routes';
import { AudienceComponent } from './audience.component';
import { TechnologyComponent } from './views/technology/technology.component';
import { GeoLocationComponent } from './views/geo-location/geo-location.component';
import { EngagementComponent } from './views/engagement/engagement.component';
import { EngagementHighlightsComponent } from './views/engagement/highlights/highlights.component';
import { EngagementMiniHighlightsComponent } from './views/engagement/mini-highlights/mini-highlights.component';
import { MiniPeakDayComponent } from './views/engagement/mini-peak-day/mini-peak-day.component';
import { EngagementTopVideosComponent } from './views/engagement/top-videos/top-videos.component';
import { EngagementDurationComponent } from './views/engagement/duration/duration.component';
import { EngagementUsersComponent } from './views/engagement/users/users.component';

import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, TagsModule, TooltipModule, PopupWidgetModule, InputHelperModule } from '@kaltura-ng/kaltura-ui';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { TableModule } from 'primeng/table';
import { DevicesOverviewComponent } from './views/technology/devices-overview/devices-overview.component';
import { CheckboxModule, OverlayPanelModule } from 'primeng/primeng';
import { TopBrowsersComponent } from './views/technology/top-browsers/top-browsers.component';
import { TopOsComponent } from './views/technology/top-os/top-os.component';
import { TopVideosTableComponent } from './views/engagement/top-videos/top-videos-table/top-videos-table.component';
import { EntryDetailsOverlayComponent } from './views/engagement/top-videos/entry-details-overlay/entry-details-overlay.component';

import { PageScrollService } from 'ngx-page-scroll';
import { UICarouselModule } from 'ui-carousel';
import { MiniTopVideosComponent } from './views/engagement/mini-top-videos/mini-top-videos.component';
import { GeoFilterComponent } from './views/geo-location/filter/filter.component';
import { ContentInteractionsComponent } from './views/content-interactions/content-interactions.component';
import { InteractionsComponent } from './views/content-interactions/interactions/interactions.component';
import { MiniInteractionsComponent } from './views/content-interactions/mini-interactions/mini-interactions.component';
import { InteractionsMiniPeakDayComponent } from './views/content-interactions/mini-peak-day/mini-peak-day.component';
import { MiniTopSharedComponent } from './views/content-interactions/mini-top-shared/mini-top-shared.component';

@NgModule({
  imports: [
    AreaBlockerModule,
    TagsModule,
    TooltipModule,
    PopupWidgetModule,
    AutoCompleteModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    PaginatorModule,
    MultiSelectModule,
    SharedModule,
    TableModule,
    InputHelperModule,
    NgxEchartsModule,
    CheckboxModule,
    RouterModule.forChild(routing),
    OverlayPanelModule,
    UICarouselModule,
  ],
  declarations: [
    AudienceComponent,
    TechnologyComponent,
    GeoLocationComponent,
    EngagementComponent,
    EngagementHighlightsComponent,
    EngagementMiniHighlightsComponent,
    EngagementTopVideosComponent,
    EngagementDurationComponent,
    EngagementUsersComponent,
    ContentInteractionsComponent,
    DevicesOverviewComponent,
    TopBrowsersComponent,
    TopOsComponent,
    TopVideosTableComponent,
    EntryDetailsOverlayComponent,
    MiniTopVideosComponent,
    MiniPeakDayComponent,
    GeoFilterComponent,
    InteractionsComponent,
    MiniInteractionsComponent,
    InteractionsMiniPeakDayComponent,
    MiniTopSharedComponent,
  ],
  exports: [],
  providers: [PageScrollService]
})
export class AudienceModule {
}
