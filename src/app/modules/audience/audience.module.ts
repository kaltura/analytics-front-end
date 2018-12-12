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
import { EngagementTopVideosComponent } from './views/engagement/top-videos/top-videos.component';
import { EngagementDurationComponent } from './views/engagement/duration/duration.component';
import { EngagementImpressionsComponent } from './views/engagement/impressions/impressions.component';
import { EngagementUsersComponent } from './views/engagement/users/users.component';
import { ContentInteractionsComponent } from './views/content-interactions/content-interactions.component';
import { FilterComponent } from './views/engagement/filter/filter.component';

import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, TagsModule, TooltipModule, PopupWidgetModule } from '@kaltura-ng/kaltura-ui';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { TableModule } from 'primeng/table';
import { DevicesOverviewComponent } from './views/technology/devices-overview/devices-overview.component';
import { CheckboxModule, OverlayPanelModule } from 'primeng/primeng';
import { TopBrowsersComponent } from './views/technology/top-browsers/top-browsers.component';
import { TopOsComponent } from './views/technology/top-os/top-os.component';
import { TopVideosTableComponent } from './views/engagement/top-videos/top-videos-table/top-videos-table.component';
import { EntryDetailsOverlayComponent } from './views/engagement/top-videos/entry-details-overlay/entry-details-overlay.component';
import { TagsFilterComponent } from './views/engagement/filter/tags-filter/tags-filter.component';
import { OwnersFilterComponent } from './views/engagement/filter/owners-filter/owners-filter.component';

import { PageScrollService } from 'ngx-page-scroll';
import { UICarouselModule } from 'ui-carousel';
import { MiniTopVideosComponent } from './views/engagement/mini-top-videos/mini-top-videos.component';
import { LocationFilterComponent } from './views/engagement/filter/location-filter/location-filter.component';

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
    EngagementImpressionsComponent,
    EngagementUsersComponent,
    FilterComponent,
    ContentInteractionsComponent,
    DevicesOverviewComponent,
    TopBrowsersComponent,
    TopOsComponent,
    TopVideosTableComponent,
    EntryDetailsOverlayComponent,
    TagsFilterComponent,
    OwnersFilterComponent,
    LocationFilterComponent,
    MiniTopVideosComponent,
  ],
  exports: [],
  providers: [PageScrollService]
})
export class AudienceModule {
}
