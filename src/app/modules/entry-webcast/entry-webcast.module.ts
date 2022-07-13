import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './entry-webcast.routes';
import { EntryWebcastViewComponent } from './entry-webcast-view.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule, PopupWidgetModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { EntryWebcastFilterComponent } from './filter/filter.component';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { WebcastMiniHighlightsComponent } from "./views/mini-highlights/mini-highlights.component";
import { WebcastGeoComponent } from "./views/geo/geo-location.component";
import { WebcastMiniQualityComponent } from "./views/mini-quality/mini-quality.component";
import { WebcastMinInsightsComponent } from "./views/mini-insights/mini-insights.component";
import { WebcastMiniEngagementComponent } from "./views/mini-engagement/mini-engagement.component";
import { WebcastMiniEngagementToolsComponent } from "./views/mini-engagement-tools/mini-engagement-tools.component";
import { WebcastDomainsComponent } from "./views/domains/domains.component";
import { WebcastDevicesComponent } from "./views/devices/devices.component";
import { WebcastEntryPreviewComponent } from "./views/entry-preview/entry-preview.component";
import { WebcastEntryUserEngagementComponent } from "./views/user-engagement/user-engagement.component";
import { WebcastMiniLiveEngagementComponent } from "./views/mini-live-engagement/mini-live-engagement.component";
import { ReactionsBreakdownOverlayComponent } from "./views/mini-engagement-tools/reactions-breakdown-overlay/reactions-breakdown-overlay.component";

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
    EntryWebcastViewComponent,
    EntryWebcastFilterComponent,
    ReactionsBreakdownOverlayComponent,
    WebcastMiniHighlightsComponent,
    WebcastMiniEngagementComponent,
    WebcastMiniQualityComponent,
    WebcastMiniLiveEngagementComponent,
    WebcastMiniEngagementToolsComponent,
    WebcastMinInsightsComponent,
    WebcastEntryPreviewComponent,
    WebcastEntryUserEngagementComponent,
    WebcastGeoComponent,
    WebcastDevicesComponent,
    WebcastDomainsComponent
  ],
  exports: [],
  providers: []
})
export class EntryWebcastModule {
}
