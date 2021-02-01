import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';
import { routing } from './playlist.routes';
import { UICarouselModule } from 'ng-carousel-iuno';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { PlaylistViewComponent } from './playlist-view.component';
import { ManualPlaylistMiniHighlightsComponent } from './views/playlist/manual/views/mini-highlights/mini-highlights.component';
import { ManualPlaylistComponent } from './views/playlist/manual/manual-playlist.component';
import { RulebasedPlaylistComponent } from './views/playlist/rule-based/rulebased-playlist.component';
import { PathViewComponent } from './views/path/path-view.component';
import { PlaylistFilterComponent } from './filter/filter.component';
import { PathEntryTotalsComponent } from './views/path/path-totals/path-totals.component';
import { BasePlaylistTotalsComponent } from './views/shared/playlist-totals/playlist-totals.component';
import { PathPerformanceComponent } from './views/path/path-performance/path-performance.component';
import { PathContentComponent } from './views/path/path-content/path-content.component';
import { PathContentTableComponent } from './views/path/path-content/path-content-table/path-content-table.component';
import { NodePreviewComponent } from './views/path/path-content/node-preview/node-preview.component';
import { NodeHotspotsComponent } from "./views/path/path-content/node-hotspots/node-hotspots.component";
import { HotspotHeatMapComponent } from "./views/path/path-content/node-hotspots/hotspot-heat-map/hotspot-heat-map.component";
import { ManualPlaylistMiniViewersEngagementComponent } from './views/playlist/manual/views/mini-viewers-engagement/mini-viewers-engagement.component';
import { MiniManualPlaylistTopVideosComponent } from './views/playlist/manual/views/mini-top-videos/mini-top-videos.component';
import { ManualPlaylistMiniTopViewersComponent } from './views/playlist/manual/views/mini-top-viewers/mini-top-viewers.component';
import { ManualPlaylistInsightGeoComponent } from './views/playlist/manual/views/insight-geo/insight-geo.component';
import { ManualPlaylistInsightDevicesComponent } from './views/playlist/manual/views/insight-devices/insight-devices.component';
import { ManualPlaylistInsightDomainsComponent } from './views/playlist/manual/views/insight-domains/insight-domains.component';
import { ManualPlaylistInsightPeakDayComponent } from './views/playlist/manual/views/insight-peak-day/insight-peak-day.component';
import { ManualPlaylistTopContentComponent, ManualPlaylistEntryDetailsOverlayComponent, ManualPlaylistTopContentTableComponent } from './views/playlist/manual/views/top-content';
import { ManualPlaylistPerformanceComponent, ManualPlylistDatesTableComponent, ManualPlaylistUsersTableComponent, ManualPlaylistEntriesTableComponent } from "./views/playlist/manual/views/performance";

@NgModule({
  imports: [
    AreaBlockerModule,
    TagsModule,
    UICarouselModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    PaginatorModule,
    SharedModule,
    TableModule,
    TooltipModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    InputHelperModule,
  ],
  declarations: [
    PlaylistViewComponent,
    ManualPlaylistComponent,
    RulebasedPlaylistComponent,
    PathViewComponent,
    ManualPlaylistMiniHighlightsComponent,
    ManualPlaylistMiniViewersEngagementComponent,
    ManualPlaylistInsightGeoComponent,
    ManualPlaylistInsightDevicesComponent,
    ManualPlaylistInsightDomainsComponent,
    ManualPlaylistInsightPeakDayComponent,
    ManualPlaylistTopContentComponent,
    ManualPlaylistPerformanceComponent,
    ManualPlylistDatesTableComponent,
    ManualPlaylistUsersTableComponent,
    ManualPlaylistEntriesTableComponent,
    MiniManualPlaylistTopVideosComponent,
    ManualPlaylistMiniTopViewersComponent,
    ManualPlaylistEntryDetailsOverlayComponent,
    ManualPlaylistTopContentTableComponent,
    PlaylistFilterComponent,
    PathEntryTotalsComponent,
    BasePlaylistTotalsComponent,
    PathPerformanceComponent,
    PathContentComponent,
    PathContentTableComponent,
    NodePreviewComponent,
    NodeHotspotsComponent,
    HotspotHeatMapComponent
  ],
  exports: [],
  providers: []
})
export class PlaylistModule {
}
